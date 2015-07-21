/// <reference path="../../typings/angular2/angular2.d.ts" />
import {Component, View} from 'angular2/angular2';

@Component({
  selector: 'backlog'
})
@View({
  templateUrl: 'components/backlog/backlog.html'
})
export class Backlog {
  constructor() {}
}

