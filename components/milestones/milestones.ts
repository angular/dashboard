/// <reference path="../../typings/angular2/angular2.d.ts" />
import {Component, NgFor, NgIf, NgSwitch, NgSwitchDefault, NgSwitchWhen, View} from 'angular2/angular2';
import {Observable, Observer} from 'rx';
import {AngularIssue, Github} from '../../lib/github';

@Component({
  selector: 'milestones'
})
@View({
  templateUrl: 'components/milestones/milestones.html',
  directives: [NgFor, NgIf, NgSwitch, NgSwitchDefault, NgSwitchWhen]
})
export class Milestones {
  milestones: Milestone[] = [];
  assignees: User[];
  issues: {[title: string]: {[login: string]: AngularIssue[]}};
  
  pages: Page[] = [];
  pageLimit: number = 12;
  activePage: number = 0;
  
  constructor(private _github: Github) {
    this._populate();
  }
  
  hasIssue(milestone: Milestone, assignee: User): boolean {
    if (!this.issues[milestone.title][assignee.login]) {
      return false;
    }
    return !!this.issues[milestone.title][assignee.login][0];
  }
  
  hasNextPage(): boolean {
    return this.activePage < this.pages.length-1;
  }
  
  hasPrevPage(): boolean {
    return this.activePage > 0;
  }
  
  nextPage(): void {
    if (this.hasNextPage()) {
      this.activePage++;
    }
  }
  
  prevPage(): void {
    if (this.hasPrevPage()) {
      this.activePage--;
    }
  }

  private _populate(): void {
    var assigneeSet = {};
    var milestoneSet = {};
    var assignees: User[] = [];
    var issueCount: {[title: string]: number} = {};
    var issues: {[title: string]: {[login: string]: AngularIssue[]}} = {};
    
    this._github.issues
        // complete the observable sequence provided by github issues
        .take(1)
        // sort issues
        .flatMap((issues: AngularIssue[]) => {
          return Observable.from<AngularIssue>(issues.sort((a: AngularIssue, b: AngularIssue) => {
            if (a.priority == b.priority) {
              return (a.number == b.number) ? 0 : (a.number > b.number) ? 1 : -1;
            }
            if (a.priority == -1) {
              return 1;
            }
            if (b.priority == -1) {
              return -1;
            }
            return (a.priority > b.priority) ? 1 : -1;
          }));
        })
        // milestones page is only for issues with a milestone or an assignee
        .filter((issue: AngularIssue) => !!(issue.milestone) && !!(issue.assignee))
        // map each issue to its respective milestone and assignee
        .map((issue: AngularIssue) => {
          var title: string = issue.milestone.title;
          var login: string = issue.assignee.login;
          if (!issues.hasOwnProperty(title)) {
            issues[title] = {};
            issueCount[title] = 0;
          }
          if (!issues[title].hasOwnProperty(login)) {
            issues[title][login] = [];
          }
          issues[title][login].push(issue);
          if (issues[title][login].length > issueCount[title]) {
            issueCount[title] = issues[title][login].length;
          }
          return issue;
        })
        // create a unique list of assignees
        .map((issue: AngularIssue) => {
          if (!assigneeSet.hasOwnProperty(issue.assignee.login)) {
            assignees.push(issue.assignee);
            assigneeSet[issue.assignee.login] = issue.assignee;
          }
          return issue;
        })
        // transform each issue to its respective milestone
        .map((issue: AngularIssue) => issue.milestone)
        // remove duplicate milestones
        .filter((milestone: Milestone) => !milestoneSet.hasOwnProperty(milestone.title))
        // mark unique milestones to filter out future duplicates
        .map((milestone: Milestone) => {
          milestoneSet[milestone.title] = milestone;
          return milestone;
        })
        // wait for all milestones to be processed
        .toArray()
        // better than Array.forEach
        .flatMap((milestones: Milestone[]) => Observable.from<Milestone>(milestones))
        // fill out the jagged grid of assignees and issues per milestone
        .map((milestone: Milestone) => {
          var title: string = milestone.title;
          assignees.map((assignee: User) => assignee.login).forEach((login: string) => {
            // not all assignees have an issue in each milestone
            if (!issues[title].hasOwnProperty(login)) {
              issues[title][login] = [];
            }
            while (issues[title][login].length < issueCount[title]) {
              issues[title][login].push(null);
            }
          });
          return milestone;
        })
        // wait for all milestones to be processed
        .toArray()
        .subscribeOnNext((milestones: Milestone[]) => {
          
          // sort assignees alphanumerically
          this.assignees = assignees.sort((a: User, b: User) => {
            return (a.login == b.login) ? 0 : (a.login > b.login) ? 1 : -1;
          });
          
          // place each assignee on a page
          var pages: Page[] = [];
          for (var page: number = 0; page * this.pageLimit < this.assignees.length; page++) {
            pages.push({number: page, assignees: []});
            for (var offset: number = 0; page * this.pageLimit + offset < this.assignees.length
                && offset < this.pageLimit; offset++) {
              pages[page].assignees.push(this.assignees[page * this.pageLimit + offset]);
            }
          }
          this.pages = pages;
          
          // sort milestones alphanumberically
          this.milestones = milestones.sort((a: Milestone, b: Milestone) => {
            return (a.title == b.title) ? 0: (a.title > b.title) ? 1 : -1;
          });
          
          this.issues = issues;
        });
  }

}

export interface Page {
  number: number;
  assignees: User[];
}