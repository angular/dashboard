/// <reference path="../typings/node/node.d.ts" />

import url = require('url');
import https = require('https');

export type PublishFn = (key: Object, data: Object) => void;

class Github {
	
	constructor(public user: string, public repo: string, public authToken: string, public publish: PublishFn) {}
	
	_url(path: string, queryParams: Object): Object {
		queryParams['auth_token'] = this.authToken;
		return url.format({
			"protocol": "https",
			"hostname": "api.github.com",
			"pathname": "/repos/" + this.user + "/" + this.repo + "/" + path,
			"query": queryParams
		});
	}
	
	_request(path: string, args: Object, cbk: Function) {
		args['access_token'] = this.authToken;
    var urlx = url.format({
				'pathname': '/repos/' + this.user + '/' + this.repo + '/' + path,
				'query': args
    });
    console.log(urlx);
		var req = https.request({
			'hostname': 'api.github.com',
			'headers': {
				'User-Agent': 'Angular Github Dashboard Test',	
			},
			'path': urlx},
			(resp) => {
				var str = '';
				resp.on('data', (chunk) => {
					str += chunk;
				});
				resp.on('end', () => {
          console.log('done: ' + str);
					cbk(null, JSON.parse(str));
				});
			}
		);
		req.end();
		req.on('error', console.log);
	}
	
	handle(req: Object, cbk: Function) {
		if (!req.hasOwnProperty("$type")) {
			return cbk(null, null);
		}
		switch (req['$type']) {
			case 'milestones':
        console.log("loading milestones");
				return this._milestones(req, cbk);
		}
	}
	
	_milestones(req: Object, cbk: Function) {
		this._request('milestones', {}, (err, data) => {
      if (err) return cbk(err);
			var output = [];
			var cnt = 0;
      console.log('got ' + data.length + ' milestones');
			for (var i = 0; i < data.length; i++) {
				var raw = data[i];
				output[i] = {
					'number': raw['number'],
					'name': raw['title'],
					'url': raw['url'],
					'issues': []
				};
				this._loadIssues(output[i], (err, res) => {
					if (err) return cbk(err);
					cnt++;
					if (cnt == data.length) {
            this.publish(req, output);
          }
				});
			}
		});
	}
  
  _milestone(req: Object, cbk: Function) {
    this._request('milestone/' + (+req['id']), {}, (err, data) => {
      if (err) return cbk(err);
      var milestone = {
        'id': data['number'],
        'name': data['title'],
        'url': data['url'],
        'desc': data['description'],
        'due': data['due_on']
      };
      this.publish(req, milestone);
      return cbk();
    });
  }
  
  _issues(req: Object, cbk: Function) {
    var args = {};
    if (req.hasOwnProperty('milestone')) {
      args['milestone'] = +req['milestone'];
    }
		this._request('issues', args, (err, data) => {
			if (err) return cbk(err);
      cbk(null, data);
		});
  }
	
	_loadIssues(milestone: Object, cbk: Function) {
    
	}
}

var gh = new Github('angular', 'angular', '<auth>');
gh.handle({'$type': 'milestones'}, (err, data) => {
  if (err) {
    console.log('error:');
    console.log(err);
    return;
  }
	console.log('done:');
	console.log(data);
});
