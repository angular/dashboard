/// <reference path="../typings/rx/rx.d.ts" />
/// <reference path="../typings/rx/rx-lite.d.ts" />
/// <reference path="../typings/github/github.d.ts" />
import {Observable, Subject} from 'rx';

declare var Firebase;

export class Github {
  private _issues: Subject<AngularIssue[]>;
  private _ref = new Firebase("https://ng2-projects.firebaseio.com");

  constructor(public owner: string, public repository: string) {}

  get isAuthenticated(): boolean { return !!(this._ref.getAuth()); }

  get issues(): Observable<AngularIssue[]> {
    if (!this._issues) { this.refresh(); }
    return this._issues;
  }

  get username(): string { return this._ref.getAuth().github.username; }

  authenticate(): void {
    this._ref.authWithOAuthPopup("github", (error: any, authData: any) => {
      if (error) { console.error(error); }
      else { console.log("Authenticated successfully!", authData); }
    });
  }
  
  refresh(): void {
    if (!this._issues) { this._issues = new Subject<AngularIssue[]>(); }
    this._fetchPage(0)
        .toArray()
        .subscribe((issues: AngularIssue[]) => this._issues.onNext(issues),
            (error: any) => this._issues.onError(error));
  }

  private _buildUrl(path: string, params: {[param: string]: any}): string {
    params['access_token'] = this._ref.getAuth().github.accessToken;
    var arr: Array<string> = Object.keys(params).map((p: string) => `${p}=${params[p]}`);
    return `https://api.github.com${path}?${arr.join('&')}`;
  }

  private _fetchPage(page: number): Observable<AngularIssue> {
    return Observable.create<AngularIssue>((observer: Rx.Observer<AngularIssue>) => {
      var http = new XMLHttpRequest();

      var url = this._buildUrl(`/repos/${this.owner}/${this.repository}/issues`, {
          per_page: 100,
          page: page
        });
      http.open("GET", url, true);
      console.log('requested issues page', page, 'from github!');

      http.onreadystatechange = () => {
        var response = http.responseText;
        if (http.readyState == 4) {
          if (http.status == 200) {
            var issues: Array<Issue> = JSON.parse(response);
            if (issues.length == 100) { this._fetchPage(page + 1).subscribe(observer); }
            Observable.from<Issue>(issues)
                .map((issue: Issue) => this._transformIssue(issue))
                .subscribe(observer);
          } else { observer.onError(response); }
        }
      };

      http.send();
    });
  }
  
  private _applyLabels(issue: Issue, angular: AngularIssue): void {
    issue.labels.forEach((label: Label) => {
      if (/^P\d/.test(label.name)) { // apply priority
        angular.priority = parseInt(label.name[1]);
      } else if (/^type/.test(label.name)) { // apply type
        angular.type = label.name.replace(/^type:/, '').trim();
      } else if (/^effort/.test(label.name)) { // apply effort
        if (/easy/.test(label.name)) angular.effort = 1;
        else if (/medium/.test(label.name)) angular.effort = 2;
        else if (/hard/.test(label.name)) angular.effort = 3;
      } else if (/^pr_state/.test(label.name)) { // apply pr_state
        var pr_state: string = label.name.replace(/^pr_state:/, '').trim();
        if (pr_state == 'blocked' || pr_state == 'LGTM') angular.pr_state = pr_state;
      } else if (/^state/.test(label.name)) { // apply state
        var state: string = label.name.replace(/^state:/, '').trim();
        if (state == 'Blocked' || state == 'PR') angular.state = state;
      }
    });
  }
  
  private _transformIssue(issue: Issue): AngularIssue {
    var angularIssue: AngularIssue = {
        assignee: issue.assignee,
        effort: -1,
        html_url: issue.html_url,
        milestone: issue.milestone,
        number: issue.number,
        priority: -1,
        pr_state: '',
        state: '',
        type: ''
    };
    this._applyLabels(issue, angularIssue);
    return angularIssue;
  }

}

export interface AngularIssue {
  assignee: User;
  effort: number;
  html_url: string;
  milestone: Milestone;
  number: number;
  priority: number;
  pr_state: string;
  state: string;
  type: string;
}