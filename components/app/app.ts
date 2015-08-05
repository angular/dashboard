/// <reference path="../../typings/angular2/angular2.d.ts" />
import {bind, bootstrap, Component, NgIf, View} from 'angular2/angular2';

@Component({selector : 'app', appInjector : []})
@View({templateUrl : 'components/app/app.html', directives : [ NgIf ]})
class App {
  activeTable: string = 'assigned';

  constructor() {}

  setActive(table: string): void {
    if (this.activeTable != table) {
      this.activeTable = table;
    }
  }

  toCapitalCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

bootstrap(App);
