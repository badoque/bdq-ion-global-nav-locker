import { NgModule }      from '@angular/core';
import { CommonModule } from '@angular/common'
import { BackManagerProvider } from './providers/back-manager';
import { GlobalNavLocker } from './providers/global-nav-locker';
// import { BdqDateTime } from './components/datetime/custom-datetime';
// import { BdqSelect } from './components/select/custom-select';

@NgModule({
  imports: [CommonModule],
  exports: [
    GlobalNavLocker,
    // BdqSelect,
    // BdqDateTime
  ],
  entryComponents:[
    // BdqSelect,
    // BdqDateTime
  ],
  declarations: [
    // BdqSelect,
    // BdqDateTime
  ],
  providers: [ 
    BackManagerProvider,
    GlobalNavLocker,
  ]
})
export class BdqIonGlobalNavLocker { }