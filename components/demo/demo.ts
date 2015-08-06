/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {Component, NgFor, View} from 'angular2/angular2';
import {Router, RouterOutlet} from 'angular2/router';
import {Observable} from 'rx';

import {Milestone} from '../../server/schema';

import tactical_dm = require('tactical/dist/tactical/src/data_manager');

@Component({selector : 'demo', appInjector : [ tactical_dm.TacticalDataManager ]})
@View({templateUrl : 'components/demo/demo.html', directives: [ NgFor ]})
export class Demo {
  
  milestones: Milestone[];
  
  
  constructor(public dm: tactical_dm.TacticalDataManager) {
    var milestonesStaging: Milestone[];
    var milestoneCount: number;
    var milestonesById: {} = {};
    dm.request({'$type': 'milestones'})
        .flatMapLatest((ids: number[]) => {
          console.log('got set of ids: ' + ids);
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
          console.log('got milestone for ' + milestone.id);
          
          milestonesStaging[idx] = milestone;
          for (var i = 0; i < milestoneCount; i++) {
            if (!milestonesStaging[i]) {
              return;
            } 
          }
          this.milestones = milestonesStaging;
          console.log('published milestones');
        });
  }
}