/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="../node_modules/tactical/dist/tactical/src/socket.d.ts" />
/// <reference path="../node_modules/tactical/dist/tactical/src/json.d.ts" />
/// <reference path="../typings/rx/rx.all.d.ts" />

import {Github} from './github';
import io = require('socket.io');
import http = require('http');
import tactical = require('tactical/dist/tactical/src/socket');
import json = require('tactical/dist/tactical/src/json');
import crypto = require('crypto');


class GithubService implements tactical.BackendService {
  
  constructor(public user: string, public repo: string, public authToken: string) {};
  
    onMutation(key: Object, base: string, id: number, mutation: Object, resolve: tactical.ResolutionHandler, fail: tactical.FailureHandler): void {
      console.log('Mutations not yet supported.');
    }

    onRequest(key: Object, publish: tactical.PublishHandler, callback: tactical.Callback): void {
      console.log(key);
      var github = new Github(this.user, this.repo, this.authToken, (objKey: Object, data: Object) => {
        var md5 = crypto.createHash('md5');
        md5.update(json.serializeValue(data));
        var version = md5.digest('hex');
        publish(objKey, version, data);
      });
      github.handle(key, (err?: any) => callback(err));
    }
}

if (process.argv.length < 6) {
	console.log('Usage: node ' + process.argv[1] + ' <user> <repo> <auth> <port>');
	process.exit(-1);
}

var user = process.argv[2];
var repo = process.argv[3];
var auth = process.argv[4];

console.log('Connecting to repo: ' + user + '/' + repo);

var server = http.createServer();
var socketIo = io(server);

var socketMgr = new tactical.SocketIOServer(new GithubService(user, repo, auth), socketIo);

socketIo.on('connection', (socket: SocketIO.Socket) => {
  socketMgr.accept(socket);
});

var port = +process.argv[5];
server.listen(port, () => console.log('Up and running on ' + port + '!'));
server.on('error', (err) => console.log(err));