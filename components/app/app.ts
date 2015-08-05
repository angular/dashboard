/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {bind, bootstrap, Component, NgIf, View} from 'angular2/angular2';
import {Router, RouterOutlet, routerInjectables} from 'angular2/router';
import {Home} from '../home/home';

@Component({selector : 'app', appInjector : []})
@View({templateUrl : 'components/app/app.html', directives : [ NgIf, RouterOutlet ]})
class App {
  activeTable: string = 'assigned';

  constructor(router: Router) {
    router.config({
      path: '/',
      component: Home
    });
  }

  setActive(table: string): void {
    if (this.activeTable != table) {
      this.activeTable = table;
    }
  }

  toCapitalCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

bootstrap(App, routerInjectables);
