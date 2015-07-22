/// <reference path="../../typings/angular2/angular2.d.ts" />
import {bootstrap, Component, View} from 'angular2/angular2';
import {Milestones} from '../milestones/milestones';
import {Hotlist} from '../hotlist/hotlist';
import {Backlog} from '../backlog/backlog';
import {Triage} from '../triage/triage';

@Component({
  selector: 'app'
})
@View({
  templateUrl: 'components/app/app.html'
})
class App {
  activeTable: string = 'milestones';

  constructor() {}

  setActive(table: string): void {
    if (this.activeTable != table) { this.activeTable = table; }
  }
}

bootstrap(App);
bootstrap(Milestones);
bootstrap(Hotlist);
bootstrap(Backlog);
bootstrap(Triage);
