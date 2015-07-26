/// <reference path="../../typings/tsd.d.ts" />
import {
  Component,
  NgFor,
  NgIf,
  NgSwitch,
  NgSwitchDefault,
  NgSwitchWhen,
  View
} from 'angular2/angular2';
import {Observable, Observer} from 'rx';
import {Github, TriagedIssue} from '../../lib/github';

@Component({selector : 'assigned'})
@View({
  templateUrl : 'components/assigned/assigned.html',
  directives : [ NgFor, NgIf, NgSwitch, NgSwitchDefault, NgSwitchWhen ]
})
export class Assigned {
  assignees: User[] = [];
  issues: IssueMap = {};
  titles: string[] = [];

  activePage: number = 0;
  pageLimit: number = 12;
  pages: Page[] = [];

  constructor(private _github: Github) { this._populate(); }

  hasIssue(title: string, login: string): boolean {
    return !!this.issues[title][login][0];
  }

  hasNextPage(): boolean { return this.activePage < this.pages.length - 1; }

  hasPrevPage(): boolean { return this.activePage > 0; }

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

  private _paginateAssignees(assignees: User[]): Page[] {
    var pages: Page[] = [];
    for (var page: number = 0; page * this.pageLimit < assignees.length;
         page++) {
      pages.push({number : page, assignees : []});
      for (var offset: number = 0;
           page * this.pageLimit + offset < assignees.length &&
           offset < this.pageLimit;
           offset++) {
        pages[page].assignees.push(assignees[page * this.pageLimit + offset]);
      }
    }
    return pages;
  }

  private _populate(): void {
    var assignees: User[] = [];
    var assigneeSet: {[login: string] : string} = {};
    var titles: string[] = [];

    this._populateIssues(assignees, assigneeSet)
        .map((issues: IssueMap) => {
          Object.keys(issues).sort().forEach((title: string) =>
                                                 titles.push(title));
          return issues;
        })
        .subscribeOnNext((issues: IssueMap) => {
          // sort assignees alphanumerically
          this.assignees = assignees.sort((a: User, b: User) => {
            return (a.login == b.login) ? 0 : (a.login > b.login) ? 1 : -1;
          });
          // place each assignee on a page
          this.pages = this._paginateAssignees(assignees);
          // update issues
          this.issues = issues;
          // update titles
          this.titles = titles;
        });
  }

  private _populateIssues(assignees: User[],
                          assigneeSet: {[login: string] :
                                            string}): Observable<IssueMap> {
    var assignedIssues: IssueMap = {};
    var issueCount: {[title: string] : number} = {};
    var issueSet: {[title: string] : string} = {};

    var OTHER: string = 'other issues';
    assignedIssues[OTHER] = {};
    issueCount[OTHER] = 0;

    return this._github.issues
        // complete the observable sequence provided by github milestoneIssues
        .take(1)
        // sort issues
        .flatMap((issues: TriagedIssue[]) => {
          return Observable.from<TriagedIssue>(
              issues.sort((a: TriagedIssue, b: TriagedIssue) => {
                if (a.priority == b.priority) {
                  return (a.number == b.number) ? 0 : (a.number > b.number)
                                                          ? 1
                                                          : -1;
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
        // milestones page is only for issues with an assignee
        .filter((issue: TriagedIssue) => !!issue.assignee)
        // create a unique list of assignees
        .map((issue: TriagedIssue) => {
          if (!assigneeSet.hasOwnProperty(issue.assignee.login)) {
            assignees.push(issue.assignee);
            assigneeSet[issue.assignee.login] = issue.assignee.login;
          }
          return issue;
        })
        // map each issue without a milestone to its respective assignee
        .map((issue: TriagedIssue) => {
          var login: string = issue.assignee.login;
          if (!assignedIssues[OTHER].hasOwnProperty(login)) {
            assignedIssues[OTHER][login] = [];
          }
          if (!issue.milestone) {
            var count: number = assignedIssues[OTHER][login].push(issue);
            if (count > issueCount[OTHER]) {
              issueCount[OTHER] = count;
            }
          }
          return issue;
        })
        // the rest of the chain is only for issues with a milestone
        .filter((issue: TriagedIssue) => !!issue.milestone)
        // map each issue to its respective milestone and assignee
        .map((issue: TriagedIssue) => {
          var title: string = issue.milestone.title;
          var login: string = issue.assignee.login;
          if (!assignedIssues.hasOwnProperty(title)) {
            assignedIssues[title] = {};
            issueCount[title] = 0;
          }
          if (!assignedIssues[title].hasOwnProperty(login)) {
            assignedIssues[title][login] = [];
          }
          var count: number = assignedIssues[title][login].push(issue);
          if (count > issueCount[title]) {
            issueCount[title] = count;
          }
          return issue.milestone.title;
        })
        // remove duplicate milestones
        .filter((title: string) => !issueSet.hasOwnProperty(title))
        // mark unique milestones to filter out future duplicates
        .map((title: string) => {
          issueSet[title] = title;
          return title;
        })
        // wait for all milestones to be processed
        .toArray()
        // better than Array.forEach
        .flatMap((titles: string[]) => {
          titles.push(OTHER);
          return Observable.from<string>(titles);
        })
        // fill out the jagged grid of assignees
        .map((title: string) => {
          assignees.map((assignee: User) => assignee.login)
              .forEach((login: string) => {
                // not all assignees have an issue in each milestone
                if (!assignedIssues[title].hasOwnProperty(login)) {
                  assignedIssues[title][login] = [];
                }
                while (assignedIssues[title][login].length <
                       issueCount[title]) {
                  assignedIssues[title][login].push(null);
                }
              });
          return true;
        })
        // wait for all milestones to be processed
        .toArray()
        .map((oks: boolean[]) => assignedIssues);
  }
}

export interface IssueMap {
  [title: string]: {[login: string] : TriagedIssue[]};
}

export interface Page {
  number: number;
  assignees: User[];
}
