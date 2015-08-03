/// <reference path="../typings/node/node.d.ts" />

import url = require('url');
import https = require('https');

class Github {
	
	constructor(public user: string, public repo: string, public authToken: string) {}
	
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
		args['auth_token'] = this.authToken;
		var req = https.request({
			'hostname': 'api.github.com',
			'headers': {
				'User-Agent': 'Angular Github Dashboard Test',	
			},
			'path': url.format({
				'pathname': '/repos/' + this.user + '/' + this.repo + '/' + path,
				'query': args
			})},
			(resp) => {
				var str = '';
				resp.on('data', (chunk) => {
					str += chunk;
				});
				resp.on('end', () => {
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
				return this._milestones(req, cbk);
		}
	}
	
	_milestones(req: Object, cbk: Function) {
		this._request('milestones', {}, (err, data) => {
			var output = [];
			var cnt = 0;
			for (var i = 0; i < data.length; i++) {
				var raw = data[i];
				output[i] = {
					'id': raw['id'],
					'name': raw['name'],
					'url': raw['url'],
					'issues': []
				};
				this._loadIssues(output[i], (err) => {
					if (err) return cbk(err);
					cnt++;
					if (cnt == data.length) return cbk(null, output);
				});
			}
		});
	}
	
	_loadIssues(milestone: Object, cbk: Function) {
		this._request('issues', {'milestone': milestone['id']}, (err, data) => {
			if (err) return cbk(err);
		});
	}
}

var gh = new Github('angular', 'angular', '<auth>');
gh.handle({'$type': 'milestones'}, (err, data) => {
	console.log('done:');
	console.log(data);
});
