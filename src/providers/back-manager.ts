import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/toPromise";

@Injectable()
export class BackManagerProvider {
    
    private backCallbacks: ((args?)=>Observable<any>)[] = [];

    constructor(
      public platform:Platform
    ){
      this.backCallbacks.push(()=>{
        let self = this;
        return Observable.create((observer)=>{
          self.platform.exitApp();
          observer.next();
          observer.complete();
        });
      });
    }

    public setRootCallback(){
      var self = this;
      return Observable.create((observer)=>{
        self.platform.exitApp();
        observer.next();
        observer.complete();
      });
    }

    public popCallback(): ()=>Observable<any> {
      return this.backCallbacks.pop();
    }
    
    public pushCallback(callback: ()=>Observable<any>){
      this.backCallbacks.push(callback);
    }
    
    public back(args?): Observable<any> {
      return this.backCallbacks[this.backCallbacks.length - 1](args);
    }

}