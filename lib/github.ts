/// <reference path="../typings/rx/rx.d.ts" />
/// <reference path="../typings/rx/rx-lite.d.ts" />
/// <reference path="../typings/github/github.d.ts" />
import {Observable, Subject} from 'rx';

declare var Firebase;

export class Github {
  private _issues: Subject<Issue[]>;
  private _ref = new Firebase("https://ng2-projects.firebaseio.com");

  constructor(public owner: string, public repository: string) {}

  get isAuthenticated(): boolean { return !!(this._ref.getAuth()); }

  get issues(): Observable<Issue[]> {
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
    if (!this._issues) { this._issues = new Subject<Issue[]>(); }
    this._fetchPage(0)
        .toArray()
        .subscribe((issues: Issue[]) => this._issues.onNext(issues),
            (error: any) => this._issues.onError(error));
  }

  private _buildUrl(path: string, params: {[param: string]: any}): string {
    params['access_token'] = this._ref.getAuth().github.accessToken;
    var arr: Array<string> = Object.keys(params).map((p: string) => `${p}=${params[p]}`);
    return `https://api.github.com${path}?${arr.join('&')}`;
  }

  private _fetchPage(page: number): Observable<Issue> {
    return Observable.create<Issue>((observer: Rx.Observer<Issue>) => {
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
            Observable.from<Issue>(issues).subscribe(observer);
          } else { observer.onError(response); }
        }
      };

      http.send();
    });
  }

}

