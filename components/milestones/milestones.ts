/// <reference path="../../typings/angular2/angular2.d.ts" />
import {Component, View} from 'angular2/angular2';
import {Github} from '../../lib/github';

@Component({
  selector: 'milestones',
  appInjector: [Github]
})
@View({
  templateUrl: 'components/milestones/milestones.html'
})
export class Milestones {
  constructor(github: Github) {}
}

