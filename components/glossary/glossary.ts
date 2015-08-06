/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {Component, View} from 'angular2/angular2';

@Component({selector : 'glossary', appInjector : []})
@View({templateUrl : 'components/glossary/glossary.html'})
export class Glossary {
  
  constructor() {}
}