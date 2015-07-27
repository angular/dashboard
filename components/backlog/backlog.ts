/// <reference path="../../lib/dashboard.d.ts" />
import {Component, View} from 'angular2/angular2';
import {Github} from '../../lib/github';

@Component({selector : 'backlog', appInjector : [ Github ]})
@View({templateUrl : 'components/backlog/backlog.html'})
export class Backlog {
  constructor(private _github: Github) {}
}
