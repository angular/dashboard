/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {Component, NgFor, View, OnDestroy, Inject, LifeCycle} from 'angular2/angular2';
import {Router, RouterLink, RouteParams} from 'angular2/router';
import {Observable} from 'rx';

import tactical_dm = require('tactical/dist/tactical/src/data_manager');

@Component({selector : 'milestone', appInjector : [ tactical_dm.TacticalDataManager ]})
@View({templateUrl : 'components/milestone/milestone.html', directives: [ NgFor, RouterLink ]})
export class Milestone implements OnDestroy {
  
  milestone: any = {};
  issues: number[];
  
  private _subIssues;
  private _subMilestone;
  
  constructor(public dm: tactical_dm.TacticalDataManager, params: RouteParams, @Inject(LifeCycle) lifeCycle: LifeCycle) {
    var milestoneId = +params.params['id'];
    this._subMilestone = dm.request({'$type': 'milestone', 'id': milestoneId})
        .subscribeOnNext((milestone: any) => {
          lifeCycle.tick();
          this.milestone = milestone;
        });
    this._subIssues = dm.request({'$type': 'issues', 'milestone': milestoneId})
        .subscribeOnNext((ids: number[]) => {
          this.issues = ids.sort();
          lifeCycle.tick();
          console.log('published issues: ', ids);
        });
  }
  
  onDestroy() {
    this._subMilestone.dispose();
    this._subIssues.dispose();
  }
}