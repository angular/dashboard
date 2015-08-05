/// <reference path="../typings/socket.io/socket.io.d.ts" />
/// <reference path="tactical.d.ts" />

import {Github} from './github';
import io = require('socket.io');
import http = require('http');

import {BackendService} from 'tactical';

if (process.argv.length < 5) {
	console.log('Usage: node ' + process.argv[1] + ' <user> <repo> <auth>');
	process.exit(-1);
}

var user = process.argv[2];
var repo = process.argv[3];

console.log('Connecting to repo: ' + user + '/' + repo);

var server = http.createServer();
var socketIo = io(server);


socketIo.on('connection', function(socket) {
	
});