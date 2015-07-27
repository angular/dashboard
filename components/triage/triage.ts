/// <reference path="../../lib/dashboard.d.ts" />
import {Component, View} from 'angular2/angular2';
import {Github} from '../../lib/github';

@Component({selector : 'triage', appInjector : [ Github ]})
@View({templateUrl : 'components/triage/triage.html'})
export class Triage {
  constructor(private _github: Github) {}
}
