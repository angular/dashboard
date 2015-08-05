/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {Component, View} from 'angular2/angular2';
import {Router, RouterOutlet} from 'angular2/router';

@Component({selector : 'home', appInjector : []})
@View({templateUrl : 'components/home/home.html'})
export class Home {
  
  constructor() {}
}