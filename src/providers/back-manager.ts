import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Observable } from "rxjs/Observable";
import * as Rx from 'rxjs/Rx';

@Injectable()
export class BackManagerProvider {
    
    private backCallbacks: ((args?)=>Rx.Observable<any>)[] = [];

    constructor(
      public platform:Platform
    ){
      this.backCallbacks.push(()=>{
        let self = this;
        return Rx.Observable.create((observer)=>{
          self.platform.exitApp();
          observer.next();
          observer.complete();
        });
      });
    }

    public setRootCallback(){
      var self = this;
      return Rx.Observable.create((observer)=>{
        self.platform.exitApp();
        observer.next();
        observer.complete();
      });
    }

    public popCallback(){
      return this.backCallbacks.pop();
    }
    
    public pushCallback(callback: ()=>Rx.Observable<any>){
      this.backCallbacks.push(callback);
    }
    
    public back(args?){
      return this.backCallbacks[this.backCallbacks.length - 1](args);
    }

}