/// <reference path="../typings/node/node.d.ts" />

import url = require('url');
import https = require('https');

export type PublishFn = (key: Object, data: Object) => void;

var PRIORITIES = {
	'P0: critical': 'P0',
	'P1: urgent': 'P1',
	'P2: required': 'P2',
	'P3: important': 'P3',
	'P4: nice to have': 'P4',
	'P!: backlog': 'P!'
};

var EFFORTS = {
	'effort1: easy (hour)': 'easy',
	'effort2: medium (day)': 'medium',
	'effort3: hard (week)': 'hard'
};

var TYPES = {
	'type: bug': 'bug',
	'type: chore': 'chore',
	'type: feature': 'feature',
	'type: performance': 'performance',
	'type: refactor': 'refactor',
	'type: RFC / discussion / question': 'discuss'
};

var BLOCKS = {
	'state: Blocked': 'blocked',
	'state: Needs Design': 'design',
	'state: PR': 'pr'
};

export class Github {
	
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
			case 'issues':
				return this._issues(req, cbk);
      case 'milestone':
        return this._milestone(req, cbk);
      case 'issue':
        return this._issue(req, cbk);
		}
	}
	
	_milestones(req: Object, cbk: Function) {
		this._request('milestones', {}, (err, data) => {
      if (err) return cbk(err);
			var output = [];
			var cnt = 0;
			for (var i = 0; i < data.length; i++) {
				output[i] = data[i]['number'];
			}
			this.publish(req, output);
			for (var i = 0; i < data.length; i++) {
				this._processMilestone({'$type': 'milestone', 'id': data[i]['number']}, data[i], (err) => {
					if (err) return cbk(err);
					cnt++;
					if (cnt == data.length) return cbk();
				});
			}
		});
	}
  
  _milestone(req: Object, cbk: Function) {
    this._request('milestones/' + (+req['id']), {}, (err, data) => {
      if (err) return cbk(err);
	    this._processMilestone(req, data, cbk);
	  });
  }

  _processMilestone(req: Object, data: Object, cbk: Function): void {
  	var milestone = {
  	  'id': data['number'],
  	  'name': data['title'],
  	  'url': data['html_turl'],
  	  'desc': data['description'],
  	  'due': data['due_on'],
  	  'issues': data['open_issues']
  	};
  	this.publish(req, milestone);
  	return cbk();
  }
  
  _issues(req: Object, cbk: Function) {
    var args = {};
    if (req.hasOwnProperty('milestone')) {
      args['milestone'] = +req['milestone'];
    }
  	this._request('issues', args, (err, data) => {
  		if (err) return cbk(err);
  		var output = [];
  		var cnt = 0;
  		for (var i = 0; i < data.length; i++) {
  			output[i] = data[i]['number'];
  		}
  		this.publish(req, output);
  		for (var i = 0; i < data.length; i++) {
  			this._processIssue({'$type': 'issue', 'id': data[i]['number']}, data[i], (err) => {
  				if (err) return cbk(err);
  				cnt++;
  				if (cnt == data.length) return cbk();
  			});
  		}
  	});
  }
  
  _issue(req: Object, cbk: Function) {
    this._request('issues/' + (+req['id']), {}, (err, data) => {
      if (err) return cbk(err);
      this._processIssue(req, data, cbk);
    });
  }
  
  _processIssue(req: Object, data: Object, cbk: Function): void {
	  var issue = {
		  'id': data['number'],
		  'name': data['title'],
		  'url': data['html_url'],
		  'priority': 'Unknown',
		  'effort': 'Unknown',
		  'blocked': 'no',
		  'assigned': ''
	  };
	  if (data.hasOwnProperty('assignee') && data['assignee'] && data['assignee'].hasOwnProperty('login')) {
		  issue['assigned'] = data['assignee']['login'];
	  }
	  if (data.hasOwnProperty('labels')) {
		  for (var i = 0; i < data['labels'].length; i++) {
			  var label = data['labels'][i]['name'];
			  if (PRIORITIES.hasOwnProperty(label)) {
				  issue['priority'] = PRIORITIES[label];
			  } else if (EFFORTS.hasOwnProperty(label)) {
				  issue['effort'] = EFFORTS[label];
			  } else if (BLOCKS.hasOwnProperty(label)) {
				  issue['blocked'] = BLOCKS[label];
			  }
		  }
	  }
	  this.publish(req, issue);
	  return cbk();
  }
}
