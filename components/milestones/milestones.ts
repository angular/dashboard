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
  assignees: {[title: string]: User[]};
  issues: {[login: string]: Issue[]};
  
  constructor(private _github: Github) {
    this._populate();
  }

  private _populate(): void {
    var milestoneSet = {};
    var assigneeSet = {};
    var assignees: {[title: string]: User[]} = {};
    var issues: {[login: string]: Issue[]} = {};
    this._github.issues
        .take(1)
        .flatMap((issues: Issue[]) => Observable.from<Issue>(issues))
        .filter((issue: Issue) => !!(issue.milestone) && !!(issue.assignee))
        .map((issue: Issue) => {
          if (!issues.hasOwnProperty(issue.assignee.login)) {
            issues[issue.assignee.login] = [];
          }
          issues[issue.assignee.login].push(issue);
          return issue;
        })
        .map((issue: Issue) => {
          if (!assignees.hasOwnProperty(issue.milestone.title)) {
            assignees[issue.milestone.title] = [];
          }
          if (!assigneeSet.hasOwnProperty(issue.assignee.login)) {
            assignees[issue.milestone.title].push(issue.assignee);
            assigneeSet[issue.assignee.login] = issue.assignee;
          }
          return issue.milestone;
        })
        .filter((milestone: Milestone) => !milestoneSet.hasOwnProperty(milestone.title))
        .map((milestone: Milestone) => {
          milestoneSet[milestone.title] = milestone;
          return milestone;
        })
        .map((milestone: Milestone) => {
          assignees[milestone.title] = assignees[milestone.title].sort((a: User, b: User) => {
            return (a.login == b.login) ? 0 : (a.login > b.login) ? 1 : -1;
          });
          return milestone;
        })
        .toArray()
        .map((milestones: Milestone[]) => {
          Observable.from<string>(Object.keys(assigneeSet))
              .subscribeOnNext((login: string) => {
                issues[login] = issues[login].sort((a: Issue, b: Issue) => {
                  return (a.number == b.number) ? 0 : (a.number > b.number) ? 1 : -1;
                });
              });
          return milestones;
        })
        .subscribeOnNext((milestones: Milestone[]) => {
          this.milestones = milestones.sort((a: Milestone, b: Milestone) => {
            return (a.title == b.title) ? 0: (a.title > b.title) ? 1 : -1;
          });
          this.assignees = assignees;
          this.issues = issues;
        });
  }

}

