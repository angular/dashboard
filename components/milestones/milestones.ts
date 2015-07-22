/// <reference path="../../typings/angular2/angular2.d.ts" />
import {Component, NgFor, View} from 'angular2/angular2';
import {Observable, Observer} from 'rx';
import {Github} from '../../lib/github';

@Component({
  selector: 'milestones'
})
@View({
  templateUrl: 'components/milestones/milestones.html',
  directives: [NgFor]
})
export class Milestones {
  milestones: Milestone[] = [];
  assignees: User[];
  issues: {[title: string]: {[login: string]: Issue[]}};
  
  constructor(private _github: Github) {
    this._populate();
  }

  private _populate(): void {
    var assigneeSet = {};
    var milestoneSet = {};
    var assignees: User[] = [];
    var issues: {[title: string]: {[login: string]: Issue[]}} = {};
    
    this._github.issues
        .take(1)
        .flatMap((issues: Issue[]) => Observable.from<Issue>(issues))
        .filter((issue: Issue) => !!(issue.milestone) && !!(issue.assignee))
        .map((issue: Issue) => {
          var title: string = issue.milestone.title;
          var login: string = issue.assignee.login;
          if (!issues.hasOwnProperty(title)) {
            issues[title] = {};
          }
          if (!issues[title].hasOwnProperty(login)) {
            issues[title][login] = [];
          }
          issues[title][login].push(issue);
          return issue;
        })
        .map((issue: Issue) => {
          if (!assigneeSet.hasOwnProperty(issue.assignee.login)) {
            assignees.push(issue.assignee);
            assigneeSet[issue.assignee.login] = issue.assignee;
          }
          return issue;
        })
        .map((issue: Issue) => issue.milestone)
        .filter((milestone: Milestone) => !milestoneSet.hasOwnProperty(milestone.title))
        .map((milestone: Milestone) => {
          milestoneSet[milestone.title] = milestone;
          return milestone;
        })
        .toArray()
        .subscribeOnNext((milestones: Milestone[]) => {
          this.assignees = assignees.sort((a: User, b: User) => {
            return (a.login == b.login) ? 0 : (a.login > b.login) ? 1 : -1;
          });
          this.milestones = milestones.sort((a: Milestone, b: Milestone) => {
            return (a.title == b.title) ? 0: (a.title > b.title) ? 1 : -1;
          });
          this.issues = issues;
        });
  }

}

