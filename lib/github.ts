/// <reference path="../typings/rx/rx.d.ts" />
/// <reference path="../typings/rx/rx-lite.d.ts" />
/// <reference path="../typings/github/github.d.ts" />
import {Observable, Scheduler} from 'rx';

declare var Firebase;

export class Github {
  private _issues: Observable<Issue>;
  private _ref = new Firebase("https://ng2-projects.firebaseio.com");

  constructor(public owner: string, public repository: string) {}

  get isAuthenticated(): boolean { return !!(this._ref.getAuth()); }

  get issues(): Observable<Issue> { 
    return this._fetchPage(0);
  }

  get username(): string { return this._ref.getAuth().github.username; }

  authenticate(): void {
    this._ref.authWithOAuthPopup("github", (error: any, authData: any) => {
      if (error) { console.error(error); }
      else { console.log("Authenticated successfully!", authData); }
    });
  }

  private _buildUrl(path: string, params: {[param: string]: any}): string {
    params['access_token'] = this._ref.getAuth().github.accessToken;
    var arr: Array<string> = Object.keys(params).map((param: string) => `${param}=${params[param]}`);
    return `https://api.github.com${path}?${arr.join('&')}`;
  }

  private _fetchPage(page: number): Observable<Issue> {
    return Observable.create<Issue>((observer: Rx.Observer<Issue>) => {
      var http = new XMLHttpRequest();

      var url = this._buildUrl(`/repos/${this.owner}/${this.repository}/issues`, {
          per_page: 10,
          page: page
        });
      http.open("GET", url, true);

      http.onreadystatechange = () => {
        var response = http.responseText;
        if (http.readyState == 4) {
          if (http.status == 200) {
            var issues: Array<Issue> = JSON.parse(response);
            if (issues.length == 100) { this._fetchPage(page + 1).subscribe(observer); }
            Observable.from<Issue>(issues).observeOn(Scheduler.default).subscribe(observer);
          } else { observer.onError(response); }
        }
      };

      http.send();
    });
  }

}

