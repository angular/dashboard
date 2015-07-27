/// <reference path="../../lib/dashboard.d.ts" />
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
import {Github} from '../../lib/github';

@Component({selector : 'assigned'})
@View({
  templateUrl : 'components/assigned/assigned.html',
  directives : [ NgFor, NgIf, NgSwitch, NgSwitchDefault, NgSwitchWhen ]
})
export class Assigned {
  assignees: User[] = [];
  issues: IssueMap = {};
  prs: PrMap = {};
  titles: string[] = [];

  activePage: number = 0;
  pageLimit: number = 12;
  pages: Page[] = [];

  constructor(private _github: Github) { this._populate(); }

  hasIssue(title: string, login: string): boolean {
    return !!this.issues[title][login][0];
  }

  hasPr(login: string): boolean { return !!this.prs[login][0]; }

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
           offset < this.pageLimit &&
           page * this.pageLimit + offset < assignees.length;
           offset++) {
        pages[page].assignees.push(assignees[page * this.pageLimit + offset]);
      }
    }
    return pages;
  }

  private _populate(): void {
    var assignees: User[] = [];
    var assigneeSet: {[login: string] : string} = {};
    var issues: IssueMap = {};
    var pages: Page[] = [];
    var prCount: number = 0;
    var prs: PrMap = {};
    var titles: string[] = [];

    this._populatePrs(assignees, assigneeSet)
        // size the assignee x pr grid
        .flatMap((prMap: PrMap) => {
          Object.keys(prMap).forEach((login: string) => {
            if (prMap[login].length > prCount) {
              prCount = prMap[login].length;
            }
          });
          prs = prMap;
          return this._populateIssues(assignees, assigneeSet);
        })
        // sort titles
        .map((issueMap: IssueMap) => {
          titles = Object.keys(issueMap).sort();
          issues = issueMap;
          return true;
        })
        // sort assignees alphanumerically
        .map((ok: boolean) => {
          assignees = assignees.sort((a: User, b: User) => {
            var left: string = a.login.toLowerCase();
            var right: string = b.login.toLowerCase();
            return (left == right) ? 0 : (left > right) ? 1 : -1;
          });
          return ok;
        })
        // fill in the jagged array
        .map((ok: boolean) => {
          assignees.forEach((assignee: User) => {
            if (!prs[assignee.login]) {
              prs[assignee.login] = [];
            }
            while (prs[assignee.login].length < prCount) {
              prs[assignee.login].push(null);
            }
          });
          return ok;
        })
        // paginate assignees
        .map((ok: boolean) => {
          pages = this._paginateAssignees(assignees);
          return ok;
        })
        // update model
        .subscribeOnNext((ok: boolean) => {
          this.assignees = assignees;
          this.pages = pages;
          this.issues = issues;
          this.titles = titles;
          this.prs = prs;
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
        // complete the observable sequence
        .take(1)
        // sort issues
        .flatMap((issues: AssignedItem[]) => {
          return Observable.from<AssignedItem>(
              issues.sort((a: AssignedItem, b: AssignedItem) => {
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
        .filter((issue: AssignedItem) => !!issue.assignee)
        // create a unique list of assignees
        .map((issue: AssignedItem) => {
          if (!assigneeSet.hasOwnProperty(issue.assignee.login)) {
            assignees.push(issue.assignee);
            assigneeSet[issue.assignee.login] = issue.assignee.login;
          }
          return issue;
        })
        // map each issue without a milestone to its respective assignee
        .map((issue: AssignedItem) => {
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
        .filter((issue: AssignedItem) => !!issue.milestone)
        // map each issue to its respective milestone and assignee
        .map((issue: AssignedItem) => {
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
        // fill out the jagged array
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

  private _populatePrs(assignees: User[],
                       assigneeSet:
                           {[login: string] : string}): Observable<PrMap> {
    var assignedPrs: PrMap = {};
    return this._github.prs
        // complete observable
        .take(1)
        // sort PRs
        .flatMap((prs: PullRequest[]) => {
          return Observable.from<any>(prs.sort((a: PullRequest,
                                                b: PullRequest) => {
            return (a.number == b.number) ? 0 : (a.number > b.number) ? 1 : -1;
          }));
        })
        // we don't care about PRs without assignees
        .filter((pr: PullRequest) => !!pr.assignee)
        // update the unique list of assignees
        .map((pr: PullRequest) => {
          if (!assigneeSet.hasOwnProperty(pr.assignee.login)) {
            assignees.push(pr.assignee);
            assigneeSet[pr.assignee.login] = pr.assignee.login;
          }
          return pr;
        })
        // map each PR to its assignee
        .map((pr: PullRequest) => {
          var login: string = pr.assignee.login;
          if (!assignedPrs.hasOwnProperty(login)) {
            assignedPrs[login] = [];
          }
          assignedPrs[login].push(pr);
          return true;
        })
        // wait for all assignees to be processed
        .toArray()
        .map((oks: boolean[]) => assignedPrs);
  }
}
