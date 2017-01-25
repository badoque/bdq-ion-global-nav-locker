import { Injectable } from '@angular/core';
import { NavController, App, ModalController, 
  ModalOptions, Modal, NavOptions, Events, 
  PopoverController, PopoverOptions,
  AlertController, AlertOptions,
  PickerController, PickerOptions,
  ActionSheetController, ActionSheetOptions,
  LoadingController, LoadingOptions } from 'ionic-angular';
import { BackManagerProvider } from './back-manager';
import { Observable } from "rxjs/Observable";
import * as Rx from 'rxjs/Rx';

// import { TeamSelectPage } from '../pages/team-select/team-select';
// import { CompleteSignupPage } from '../pages/complete-signup/complete-signup';
// import { AuthMethodChoicePage } from '../pages/auth-method-choice/auth-method-choice';

export class QueuedItem {

  private typeToFunctionNameMap = {
    'push': 'tryPushPage',
    'setRoot': 'trySetRootPage',
    'modal': 'tryPresentModal',
    'popover': 'tryPresentPopover',
    'alert': 'tryPresentAlert',
    'actionSheet': 'tryPresentActionSheet',
    'loading': 'tryPresentLoading',
    'picker': 'tryPresentPicker'
  };

  private observer: any;

  constructor(
    private globalNavLocker: GlobalNavLocker,
    public type: 'push' | 'setRoot' | 'modal' | 'popover' | 'alert' | 'actionSheet' | 'loading' | 'picker', 
    public args: any[]
  ){}

  setObserver(observer){
    this.observer = observer;
  }

  call(){
    let action = this.globalNavLocker[this.typeToFunctionNameMap[this.type]];
    let promise = action.apply(this.globalNavLocker, this.args)
      .then((args)=>{
        this.observer.next(args);
        this.observer.complete();
      })
      .catch((args)=>{
        this.observer.error(args);
        this.observer.complete();
      });
  }
}

@Injectable()
export class GlobalNavLocker {
  private nav: NavController;
  private pageLock: boolean = false;
  private queue: QueuedItem[] = [];

  constructor(
    app: App, 
    private events: Events,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private pickerCtrl: PickerController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private backManager: BackManagerProvider
  ) {
    this.pageLock = false;
    this.nav = app.getRootNav();
  }

  public setNav(nav){
    this.nav = nav;
  }

  public getPageLock() {
    return this.pageLock;
  }

  public tryLock() {
    if (this.pageLock) {
      return false;
    }

    this.pageLock = true;
    return true;
  }

  private tryLockAndDoSomething(callback){
    let self = this;
    let observable:Rx.Observable<any> = Rx.Observable.create((observer)=>{
      if(self.tryLock()){
        callback(observer);
      } else {
        observer.error();
        observer.complete();
      }
    });

    return observable.toPromise();
  }

  public unlock() {
    this.pageLock = false;
    let queuedItem = this.queue.shift();
    if(queuedItem){
      queuedItem.call();
    }
  }

  public forceUnlock() {
    this.pageLock = false;
  }

  private enqueueSomething(item: QueuedItem){
    return Rx.Observable.create((observer)=>{
      if(this.pageLock){
        item.setObserver(observer);
        this.queue.push(item);
      } else {
        item.setObserver(observer);
        item.call();
      }
    }).toPromise();
  }

  public enqueuePushPage(page: any, params?: any, opts?: NavOptions, done?: Function){
    return this.enqueueSomething(new QueuedItem(this, 'push', [page, params, opts, done]));
  }


  public tryPushPage(page: any, params?: any, opts?: NavOptions, done?: Function){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      self.backManager.pushCallback(()=>{
        return Rx.Observable.create((backObserver)=>{
          self.backManager.popCallback();
          self.nav.pop();
          backObserver.next();
          backObserver.complete();
        });
      });
      let promise = self.nav.push(page, params, opts, done);

      if(promise !== undefined){
        promise
          .then(()=>{
            observer.next();
            observer.complete();
          })
          .catch((args)=>{
            self.events.publish('permissionDeniedRedirect');
            observer.error();
            observer.complete();
          });
      } else {
        observer.next();
        observer.complete();
      }
    });
  }

  public enqueueSetRootPage(page: any, params?: any, opts?: NavOptions, done?: Function){
    return this.enqueueSomething(new QueuedItem(this, 'setRoot', [page, params, opts, done]));
  }

  public trySetRootPage(page: any, params?: any, opts?: NavOptions, done?: Function){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      this.backManager.setRootCallback();
      let promise = this.nav.setRoot(page, params, opts, done);
      if(promise !== undefined){
        promise
          .then(()=>{
            observer.next();
            observer.complete();
          })
          .catch(()=>{
            self.events.publish('permissionDeniedRedirect');
            observer.error();
            observer.complete();
          });
      } else {
        observer.next();
        observer.complete();
      }
    });
  }


  public enqueuePresentModal(component: any, data?: any, opts?: ModalOptions){
    return this.enqueueSomething(new QueuedItem(this, 'modal', [component, data, opts]));
  }

  public tryPresentModal(component: any, data?: any, opts?: ModalOptions){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      let modal = this.modalCtrl.create(component, data, opts);
      let originalModalDismiss = modal.dismiss;
      self.backManager.pushCallback((args?:any)=>{
        return Rx.Observable.create((backObserver)=>{
          let data, role, navOptions;
          if(args !== undefined){
            data = args.data;
            role = args.role;
            navOptions = args.navOptions;
          }
          originalModalDismiss.call(modal, data, role, navOptions)
            .then(()=>{
              self.backManager.popCallback();
              backObserver.next();
              backObserver.complete();
            })
            .catch(()=>{
              backObserver.error();
              backObserver.complete();
            });
        });
      });
      modal.dismiss = (data?: any, role?: any, navOptions?: NavOptions) => {
        let args = {
          data: data, 
          role: role, 
          navOptions: navOptions
        }
        return self.tryBack(args).toPromise();
      };
      
      modal.present()
        .then(()=>{
          observer.next(modal);
          observer.complete();
        })
        .catch(()=>{
          observer.error(modal);
          observer.complete();
        });
      
    })
  }


  public enqueuePresentPopover(component: any, data?: any, opts?: PopoverOptions){
    return this.enqueueSomething(new QueuedItem(this, 'popover', [component, data, opts]));
  }

  public tryPresentPopover(component: any, data?: any, opts?: PopoverOptions){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      let popover = this.popoverCtrl.create(component, data, opts);
      let originalPopoverDismiss = popover.dismiss;
      self.backManager.pushCallback((args?:any)=>{
        return Rx.Observable.create((backObserver)=>{
          let data, role, navOptions;
          if(args !== undefined){
            data = args.data;
            role = args.role;
            navOptions = args.navOptions;
          }
          originalPopoverDismiss.call(popover, data, role, navOptions)
            .then(()=>{
              self.backManager.popCallback();
              backObserver.next();
              backObserver.complete();
            })
            .catch(()=>{
              backObserver.error();
              backObserver.complete();
            });
        });
      });
      popover.dismiss = (data?: any, role?: any, navOptions?: NavOptions) => {
        let args = {
          data: data, 
          role: role, 
          navOptions: navOptions
        }
        return self.tryBack(args).toPromise();
      };
      
      popover.present()
        .then(()=>{
          observer.next(popover);
          observer.complete();
        })
        .catch(()=>{
          observer.error(popover);
          observer.complete();
        });
      
    })
  }

  public enqueuePresentLoading(opts?: LoadingOptions){
    return this.enqueueSomething(new QueuedItem(this, 'loading', [opts]));
  }

  public tryPresentLoading(opts?: LoadingOptions){
    let self = this;

    let observable = self.tryLockAndDoSomething((observer)=>{
      let loading = this.loadingCtrl.create(opts);
      let originalLoadingDismiss = loading.dismiss;
      self.backManager.pushCallback((args?:any)=>{
        return Rx.Observable.create((observer)=>{
          observer.next();
          observer.complete();
        });
      });

      loading.dismiss = (data?: any, role?: any, navOptions?: NavOptions) => {
        self.backManager.popCallback();
        self.unlock();
        return originalLoadingDismiss.call(loading, data, role, navOptions);
      }
      loading.present()
        .then(()=>{
          observer.next(loading);
          observer.complete();
        })
        .catch(()=>{
          observer.error(loading);
          observer.complete();
        });
    });

    return observable;
  }

  public enqueuePresentAlert(opts?: AlertOptions){
    return this.enqueueSomething(new QueuedItem(this, 'alert', [opts]));
  }

  public tryPresentAlert(opts?: AlertOptions){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      let alert = this.alertCtrl.create(opts);
      let originalAlertDismiss = alert.dismiss;
      self.backManager.pushCallback((args?:any)=>{
        return Rx.Observable.create((backObserver)=>{
          let data, role, navOptions;
          if(args !== undefined){
            data = args.data;
            role = args.role;
            navOptions = args.navOptions;
          }
          originalAlertDismiss.call(alert, data, role, navOptions)
            .then(()=>{
              self.backManager.popCallback();
              backObserver.next();
              backObserver.complete();
            })
            .catch(()=>{
              backObserver.error();
              backObserver.complete();
            });
          
        });
      });
      alert.dismiss = (data?: any, role?: any, navOptions?: NavOptions) => {
        let args = {
          data: data, 
          role: role, 
          navOptions: navOptions
        }
        return self.tryBack(args).toPromise().catch(()=>{});
      };
      alert.present()
        .then(()=>{
          self.unlock();
          observer.next(alert);
          observer.complete();
        })
        .catch(()=>{
          observer.error(alert);
          observer.complete();
        });
    })
  }

  public enqueuePresentPicker(opts){
    return this.enqueueSomething(new QueuedItem(this, 'picker', [opts]));
  }

  public tryPresentPicker(opts?: PickerOptions){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      let picker = this.pickerCtrl.create(opts);
      let originalPickerDismiss = picker.dismiss;
      self.backManager.pushCallback((args?:any)=>{
        return Rx.Observable.create((backObserver)=>{
          let data, role, navOptions;
          if(args !== undefined){
            data = args.data;
            role = args.role;
            navOptions = args.navOptions;
          }
          originalPickerDismiss.call(picker, data, role, navOptions)
            .then(()=>{
              self.backManager.popCallback();
              backObserver.next();
              backObserver.complete();
            })
            .catch(()=>{
              backObserver.error();
              backObserver.complete();
            });
          
        });
      });
      picker.dismiss = (data?: any, role?: any, navOptions?: NavOptions) => {
        let args = {
          data: data, 
          role: role, 
          navOptions: navOptions
        }
        return self.tryBack(args).toPromise().catch(()=>{});
      };
      picker.present()
        .then(()=>{
          self.unlock();
          observer.next(picker);
          observer.complete();
        })
        .catch(()=>{
          observer.error(picker);
          observer.complete();
        });
    })
  }

  public enqueuePresentActionSheet(opts){
    return this.enqueueSomething(new QueuedItem(this, 'actionSheet', [opts]));
  }

  public tryPresentActionSheet(opts?: ActionSheetOptions){
    let self = this;
    return self.tryLockAndDoSomething((observer)=>{
      let actionSheet = this.actionSheetCtrl.create(opts);
      let originalActionSheetDismiss = actionSheet.dismiss;
      self.backManager.pushCallback((args?:any)=>{
        return Rx.Observable.create((backObserver)=>{
          let data, role, navOptions;
          if(args !== undefined){
            data = args.data;
            role = args.role;
            navOptions = args.navOptions;
          }
          originalActionSheetDismiss.call(actionSheet, data, role, navOptions)
            .then(()=>{
              self.backManager.popCallback();
              backObserver.next();
              backObserver.complete();
            })
            .catch(()=>{
              backObserver.error();
              backObserver.complete();
            });
          
        });
      });
      actionSheet.dismiss = (data?: any, role?: any, navOptions?: NavOptions) => {
        let args = {
          data: data, 
          role: role, 
          navOptions: navOptions
        }
        return self.tryBack(args).toPromise().catch(()=>{});
      };
      actionSheet.present()
        .then(()=>{
          self.unlock();
          observer.next(actionSheet);
          observer.complete();
        })
        .catch(()=>{
          observer.error(actionSheet);
          observer.complete();
        });
    })
  }

  public tryBack(args?:any){
    let self = this;
    let observable = Rx.Observable.create((observer)=>{
      if(self.tryLock()){
        self.backManager.back(args).subscribe(
          ()=>{
            observer.next();
            self.unlock();
            observer.complete();
          },
          ()=>{
            observer.error();
            self.unlock();
            observer.complete();
          }
        );
      } else {
        observer.error();
        observer.complete();
      }
    });

    observable.subscribe(()=>{}, ()=>{});

    return observable;
  }

}	