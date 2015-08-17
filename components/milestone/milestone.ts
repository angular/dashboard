/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {Component, NgIf, NgFor, View, OnDestroy, Inject, LifeCycle} from 'angular2/angular2';
import {Router, RouterLink, RouteParams} from 'angular2/router';
import {Observable} from 'rx';
import {Issue} from '../../server/schema';
import tactical_dm = require('tactical/dist/tactical/src/data_manager');

@Component({selector : 'milestone', appInjector : [ tactical_dm.TacticalDataManager ]})
@View({templateUrl : 'components/milestone/milestone.html', directives: [ NgIf, NgFor, RouterLink ]})
export class Milestone implements OnDestroy {
  
  milestone: any = {};
  issues: Issue[];
  
  private _subIssues;
  private _subMilestone;

  constructor(public dm: tactical_dm.TacticalDataManager, params: RouteParams, @Inject(LifeCycle) lifeCycle: LifeCycle) {
    var milestoneId = +params.params['id'];
    this._subMilestone = dm.request({'$type': 'milestone', 'id': milestoneId})
        .subscribeOnNext((milestone: any) => {
          lifeCycle.tick();
          this.milestone = milestone;
        });
    var issuesById = {};
    var issuesStaging = [];
    var issueCount;
    this._subIssues = dm.request({'$type': 'issues', 'milestone': milestoneId})
        .flatMapLatest((ids: number[]) => {
          console.log('published issues: ', ids);
          issuesById = {};
          issuesStaging = [];
          issueCount = ids.length;
          var reqs = [];
          for (var i = 0; i < ids.length; i++) {
            issuesById[ids[i]] = i;
            reqs.push(dm.request({'$type': 'issue', 'id': ids[i]}));
          }
          return Observable.merge(reqs);
        })
        .subscribe((issue: Issue) => {
          if (!issuesById.hasOwnProperty('' + issue.id)) {
            return;
          }
          var idx = issuesById['' + issue.id];
          issuesStaging[idx] = issue;
          for (var i = 0; i < issueCount; i++) {
            if (!issuesStaging[i]) {
              return;
            } 
          }
          this.issues = issuesStaging;
          lifeCycle.tick();
        });
  }
  
  onDestroy() {
    this._subMilestone.dispose();
    this._subIssues.dispose();
  }
}
