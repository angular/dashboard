/// <reference path="dashboard.d.ts" />
import {Observable, Subject} from 'rx';
declare var Firebase;

export class Github {
  private _issues: Subject<AssignedItem[]>;
  private _prs: Subject<PullRequest[]>;
  private _ref = new Firebase("https://ng2-projects.firebaseio.com");

  constructor(public owner: string, public repository: string) {}

  get isAuthenticated(): boolean { return !!(this._ref.getAuth()); }

  get issues(): Observable<AssignedItem[]> {
    if (!this._issues) {
      this._fetchIssues();
    }
    return this._issues;
  }

  get prs(): Observable<PullRequest[]> {
    if (!this._prs) {
      this._fetchPrs();
    }
    return this._prs;
  }

  get username(): string {
    return (this.isAuthenticated) ? this._ref.getAuth().github.username : '';
  }

  authenticate(): void {
    this._ref.authWithOAuthPopup("github", (error: any, authData: any) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Authenticated successfully!", authData);
        this.refresh();
      }
    });
  }

  refresh(): void {
    this._fetchIssues();
    this._fetchPrs();
  }

  private _applyLabels(issue: Issue, assigned: AssignedItem): void {
    issue.labels.forEach((label: Label) => {
      if (/^P\d/.test(label.name)) { // apply priority
        assigned.priority = parseInt(label.name[1]);
      } else if (/^type/.test(label.name)) { // apply type
        assigned.type = label.name.replace(/^type:/, '').trim();
      } else if (/^effort/.test(label.name)) { // apply effort
        if (/easy/.test(label.name))
          assigned.effort = 1;
        else if (/medium/.test(label.name))
          assigned.effort = 2;
        else if (/hard/.test(label.name))
          assigned.effort = 3;
      } else if (/^pr_state/.test(label.name)) { // apply pr_state
        var pr_state: string = label.name.replace(/^pr_state:/, '').trim();
        if (pr_state == 'blocked' || pr_state == 'LGTM')
          assigned.pr_state = pr_state;
      } else if (/^state/.test(label.name)) { // apply state
        var state: string = label.name.replace(/^state:/, '').trim();
        if (state == 'Blocked' || state == 'PR')
          assigned.state = state;
      }
    });
  }

  private _buildUrl(path: string,
                    params: {[param: string] : string} = {}): string {
    params['access_token'] = this._ref.getAuth().github.accessToken;
    params['per_page'] = '100';
    var arr: Array<string> =
        Object.keys(params).map((p: string) => `${ p }=${ params[p] }`);
    return `https://api.github.com${ path }?${ arr.join('&') }`;
  }

  private _fetchIssues(): void {
    if (!this._issues) {
      this._issues = new Subject<AssignedItem[]>();
    }
    if (!this.isAuthenticated) {
      return;
    }
    var path: string = `/repos/${ this.owner }/${ this.repository }/issues`;
    this._fetchPage<Issue>(this._buildUrl(path))
        .map((issue: Issue) => this._triageIssue(issue))
        .toArray()
        .subscribeOnNext((issues: AssignedItem[]) =>
                             this._issues.onNext(issues));
  }

  private _fetchPrs(): void {
    if (!this._prs) {
      this._prs = new Subject<PullRequest[]>();
    }
    if (!this.isAuthenticated) {
      return;
    }
    var path: string = `/repos/${ this.owner }/${ this.repository }/pulls`;
    var params: {[p: string] : string} = {'state' : 'open'};
    this._fetchPage<PullRequest>(this._buildUrl(path, params))
        .toArray()
        .subscribeOnNext((prs: PullRequest[]) => this._prs.onNext(prs));
  }

  private _fetchPage<T>(url: string, page: number = 0): Observable<T> {
    return Observable.create<T>((observer: Rx.Observer<T>) => {
      var http = new XMLHttpRequest();
      http.open("GET", url + `&page=${ page }`, true);
      console.log('requested page', page, 'from', url);

      http.onreadystatechange = () => {
        var response = http.responseText;
        if (http.readyState == 4) {
          if (http.status == 200) {
            var data: Array<T> = JSON.parse(response);
            if (data.length >= 100) {
              this._fetchPage(url, page + 1)
                  .merge(Observable.from<T>(data))
                  .subscribe(observer);
            } else {
              Observable.from<T>(data).subscribe(observer);
            }
          } else {
            observer.onError(response);
          }
        }
      };

      http.send();
    });
  }

  private _triageIssue(issue: Issue): AssignedItem {
    var assignedIssue: AssignedItem = {
      assignee : issue.assignee,
      effort : -1,
      html_url : issue.html_url,
      milestone : issue.milestone,
      number : issue.number,
      priority : -1,
      pr_state : '',
      state : '',
      type : ''
    };
    this._applyLabels(issue, assignedIssue);
    return assignedIssue;
  }
}
