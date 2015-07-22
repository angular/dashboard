declare var Firebase;

export interface Issue {

}

export class Github {
  issues: {[issue: string]: Issue} = {};
  private _ref = new Firebase("https://ng2-projects.firebaseio.com");

  constructor(public owner: string, public repository: string) {
    if (this.isAuthenticated) { this.refresh(); }
  }

  get isAuthenticated(): boolean { return !!(this._ref.getAuth()); }

  get username(): string { return this._ref.getAuth().github.username; }

  authenticate(): void {
    this._ref.authWithOAuthPopup("github", (error: any, authData: any) => {
      if (error) { console.error(error); }
      else { console.log("Authenticated successfully!", authData); this.refresh(); }
    });
  }

  refresh(): void {
    this._fetchPage(0);
  }

  private _buildUrl(path: string, params: {[param: string]: any}): string {
    params['access_token'] = this._ref.getAuth().github.accessToken;
    var arr: Array<string> = Object.keys(params).map((param: string) => `${param}=${params[param]}`);
    return `https://api.github.com${path}?${arr.join('&')}`;
  }

  private _fetchPage(page: number): void {
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
          console.log(issues[0]);
          if (issues.length == 100) {
            this._fetchPage(page + 1);
          }
        } else { console.error(response); }
      }
    };

    http.send();
  }

}

