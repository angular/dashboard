/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {Component, NgFor, View, OnDestroy, Inject, LifeCycle} from 'angular2/angular2';
import {Router, RouterLink, RouterOutlet} from 'angular2/router';
import {Observable} from 'rx';
import {Milestone} from '../../server/schema';
import tactical_dm = require('tactical/dist/tactical/src/data_manager');

@Component({selector : 'demo', appInjector : [ tactical_dm.TacticalDataManager ]})
@View({templateUrl : 'components/demo/demo.html', directives: [ NgFor, RouterLink ]})
export class Demo implements OnDestroy {
  
  milestones: Milestone[];
  
  private _sub;
  
  constructor(public dm: tactical_dm.TacticalDataManager, @Inject(LifeCycle) lifeCycle: LifeCycle) {
    var milestonesStaging: Milestone[];
    var milestoneCount: number;
    var milestonesById: {} = {};
    this._sub = dm.request({'$type': 'milestones'})
        .flatMapLatest((ids: number[]) => {
          console.log('published milestones: ', ids);
          milestonesById = {};
          milestonesStaging = [];
          milestoneCount = ids.length;
          var reqs = [];
          for (var i = 0; i < ids.length; i++) {
            milestonesById[ids[i]] = i;
            reqs.push(dm.request({'$type': 'milestone', 'id': ids[i]}));
          }
          return Observable.merge(reqs);
        })
        .subscribe((milestone: Milestone) => {
          if (!milestonesById.hasOwnProperty('' + milestone.id)) {
            return;
          }
          var idx = milestonesById['' + milestone.id];
          milestonesStaging[idx] = milestone;
          for (var i = 0; i < milestoneCount; i++) {
            if (!milestonesStaging[i]) {
              return;
            } 
          }
          this.milestones = milestonesStaging;
          lifeCycle.tick();
        });
  }
  
  onDestroy() {
    this._sub.dispose();
  }
}
