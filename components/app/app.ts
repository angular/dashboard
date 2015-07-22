/// <reference path="../../typings/angular2/angular2.d.ts" />
import {bind, bootstrap, Component, NgIf, View} from 'angular2/angular2';
import {Milestones} from '../milestones/milestones';
import {Hotlist} from '../hotlist/hotlist';
import {Backlog} from '../backlog/backlog';
import {Triage} from '../triage/triage';
import {Github} from '../../lib/github';

@Component({
  selector: 'app',
  appInjector: [Github]
})
@View({
  templateUrl: 'components/app/app.html',
  directives: [NgIf]
})
class App {
  activeTable: string = 'milestones';

  constructor(private _github: Github) {}

  get username(): string { return this._github.username; }

  authenticate(): void {
    this._github.authenticate();
  }

  isAuthenticated(): boolean {
    return this._github.isAuthenticated;
  }

  setActive(table: string): void {
    if (this.activeTable != table) { this.activeTable = table; }
  }

}

var github: Github = new Github('angular', 'angular');

bootstrap(App, [bind(Github).toValue(github)]);
bootstrap(Milestones, [bind(Github).toValue(github)]);
bootstrap(Hotlist, [bind(Github).toValue(github)]);
bootstrap(Backlog, [bind(Github).toValue(github)]);
bootstrap(Triage, [bind(Github).toValue(github)]);
