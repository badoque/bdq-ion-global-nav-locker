# GlobalNavLocker

  ## Why to use?

  Ionic navigation system is very simple: there is push and pop methods to manage views opening and closing and when you want to force a view to render independent of the navigation stack you can the setRoot method. But it does not handle concurrent calls very well, for example when a button click action pushes a view and the user clicks the button multiple times really fast, your app will push the same view multiple times, and that is not the commonly desired behavior, for sure. 

  What the GlobalNavLocker does is to give the user a bunch of methods to manage navigation have in mind the user almost never wants to open a view more than once. It also handle modals, alerts, popovers, selects, datepickers, and other components that suffer of the same problem.

  GlobalNavLocker also has support to multiple local navigations, allowing further control of the application flow.


  ## How to install

  The package is available on NPM so you just need to run:

  `npm install --save bdq-ion-global-nav-locker`

  After that you just have to set the nav which you want to use as your global navigator in your app main component, in the ngOnInit method like in the example bellow:

  ```typescript
  import { Component, ViewChild, OnInit } from '@angular/core';
  import { Nav, Platform } from 'ionic-angular';
  import { SplashScreen } from '@ionic-native/splash-screen';
  import { StatusBar } from '@ionic-native/status-bar';
  import { GlobalNavLocker } from 'bdq-ion-global-nav-locker';

  import { HomePage } from '../pages/home/home';
  import { ExamplePage } from '../pages/example/example';

  @Component({
    templateUrl: 'app.html'
  })
  export class AppComponent implements OnInit {
    @ViewChild(Nav) nav: Nav;

    rootPage: any;

    constructor(
      private platform: Platform,
      private splashScreen: SplashScreen,
      private statusBar: StatusBar,
      private gnl: GlobalNavLocker,
    ) {
      this.rootPage = HomePage;
      platform.ready().then(() => {
        splashScreen.hide();
        statusBar.styleDefault();
      });
    }

    ngOnInit(){
      this.gnl.setNav(this.nav);
    }

    pushInGlobalNav() {
      this.gnl.tryPushPage(ExamplePage);
    }

  }
  ```

  You need to inject GlobalNavLocker in you components constructor. Remember not adding it to `providers` property in component decorator options, because this will create a new instance of the GlobalNavLocker, and will not garantee that all the components in the application are sharing the same navigator handler.

  You can also initialize one or more local navigations and push/pop on them afterwards. Calling tryBack() from a local navigation instance pops the in local navigation instead of the in global one.

  ```typescript
  import { Component, ViewChild, OnInit } from '@angular/core';
  import { Nav, Platform, NavController } from 'ionic-angular';
  import { SplashScreen } from '@ionic-native/splash-screen';
  import { StatusBar } from '@ionic-native/status-bar';
  import { GlobalNavLocker } from 'bdq-ion-global-nav-locker';

  import { HomePage } from '../pages/home/home';
  import { ExamplePage } from '../pages/example/example';

  @Component({
    templateUrl: 'app.html'
  })
  export class AppComponent implements OnInit {
    @ViewChild(Nav) nav: Nav;

    rootPage: any;

    constructor(
      private platform: Platform,
      private splashScreen: SplashScreen,
      private statusBar: StatusBar,
      private gnl: GlobalNavLocker,
      private localNav: LocalNav,
    ) {
      this.rootPage = HomePage;
      platform.ready().then(() => {
        splashScreen.hide();
        statusBar.styleDefault();
      });
    }

    ngOnInit(){
      this.gnl.setNav(this.nav);
      this.gnl.addLocalNav("local-nav", this.localNav);
    }

    pushInLocalNav() {
      this.gnl.tryLocalPushPage('local-nav', ExamplePage);
    }

  }
  ```

  ## How to use?

  The GlobalNavLocker is an angular2 provider that has methods similar to the one in ionic2 navigator and some of the components that also need to share navigation handler.


  The methods available are:

  * `tryPushPage`: Is similar to ionic navigator's push method, and receive the same arguments. It opens a component if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePushPage`: Enqueues the component push on the navigator, so when all the actions previously enqueued have finished, it will be executed. 

  * `trySetRootPage`: Is similar to ionic navigator's setRoot method, and receive the same arguments. It opens a component if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `tryPresentModal`: Synthesises ionic modal creation and presentation in one method. The arguments are the same as the creation method. It opens a modal if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePresentModal`: Enqueues the modal creation and presentation on the navigator, so when all the actions previously enqueued have finished, it will be executed.

  * `tryPresentPopover`: Synthesises ionic popover creation and presentation in one method. The arguments are the same as the creation method. It opens a modal if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePresentPopover`: Enqueues the popover creation and presentation on the navigator, so when all the actions previously enqueued have finished, it will be executed.

  * `tryPresentLoading`: Synthesises ionic loader creation and presentation in one method. The arguments are the same as the creation method. It opens a modal if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePresentLoading`: Enqueues the loader creation and presentation on the navigator, so when all the actions previously enqueued have finished, it will be executed.

  * `tryPresentAlert`: Synthesises ionic alert creation and presentation in one method. The arguments are the same as the creation method. It opens a modal if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePresentAlert`: Enqueues the alert creation and presentation on the navigator, so when all the actions previously enqueued have finished, it will be executed.

  * `tryPresentPicker`: Synthesises ionic picker creation and presentation in one method. The arguments are the same as the creation method. It opens a modal if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePresentPicker`: Enqueues the picker creation and presentation on the navigator, so when all the actions previously enqueued have finished, it will be executed.

  * `tryPresentActionSheet`: Synthesises ionic action sheet creation and presentation in one method. The arguments are the same as the creation method. It opens a modal if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `enqueuePresentActionSheet`: Enqueues the action sheet creation and presentation on the navigator, so when all the actions previously enqueued have finished, it will be executed.

  * `tryBack`: Synthesises the back button action for any open component. It stores a stack of actions. Everytime you use any other method of GlobalNavLocker, it adds the specific related action.

  * `trySetLocalRootPage`: Is similar trySetRootPage method and receives the same arguments plus the local nav key (a string). It opens a component view in a local navigation if the GlobalNavLocker navigator handler is not busy opening anything else.

  * `tryLocalPushPage`: Is similar to tryLocalPushPage and receives the same arguments plus the local nav key (a string). It opens a component view in a local navigation if the GlobalNavLocker navigator handler is not busy opening anything else.


  ## How to build?

  You only need to run `gulp package`.


  ## Roadmap

  * Multiple navigators: Now only root navigator is supported. You can set the navigator to be the local one with `setNav` method, but it will affect the global service.
  * Tests: This project does not have any unit test yet, so our first goal is to create a document with the test cases and create a test process in the build


  ## How to contribute?

  We are still defining a contribution process, but for now pull requests are welcome. If you have any trouble with bugs, or need some feature that is not available, *issues* are more than welcome too.
