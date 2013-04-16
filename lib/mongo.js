"use strict";
var utils = require('./utils');
var path = require('path');
var cp = require('child_process');
var events = require('events');

function Server(config) {
	this.config = config;
	this.guid = utils.generateServerUUID();
	this.log = this.config.log;
	this.eventer = new events.EventEmitter();
	this.expectExit = false;
}

Server.prototype.initialize = function (callback) {
	new utils.QuickProcess("which", ["mongod"]).launch(function (err, data) {
		if (err) {
			return callback(err);
		}
		if (!data || !data.length) {
			callback(new Error("Mongodb not found"));
		}
		this.mongodPath = path.normalize(data.toString().replace(/(^\s+|\s+$)/g, ''));
		this.dbLocation = this.config.resolvePath(this.config.dbLocation);
		this.log.info('Using mongod at: ' + this.mongodPath);
		this.log.info('dbLocation: ' + this.dbLocation);
		new utils.QuickProcess("mkdir", ["-p", this.dbLocation]).launch(function (err) {
			if (err) {
				return callback(err);
			}
			callback();
		}.bind(this));
	}.bind(this));
};

Server.prototype.start = function (callback) {
	this.eventer.on('mongostarted', callback);
	var errcb = function () {
		callback(new Error("mongod exited prematurely"));
	};
	this.eventer.on('mongoexit', errcb);
	this.mongodProcess = cp.spawn(this.mongodPath, ["--dbpath", this.dbLocation, "--port", this.config.port]);
	if (!this.mongodProcess) {
		return callback(new Error("Couldnt create mongod process"));
	}
	var outstream = (new utils.LineBreaker(new utils.StringEncoder(this.mongodProcess.stdout)));
	outstream.on('data', function (chunk) {
		var strfind = 'waiting for connections on port ' + this.config.port;
		this.log.info(chunk);
		if (chunk.indexOf(strfind) > -1) {
			this.log.info("Found string " + strfind + "]. Mongod must have started");
			this.eventer.removeListener('mongoexit', errcb);
			this.eventer.emit('mongostarted');
		}
	}.bind(this));
	outstream.on('end', function () {
		if (!this.expectExit)
			this.log.fatal("Mongodb Quit");
	}.bind(this));
	var errstream = (new utils.LineBreaker(new utils.StringEncoder(this.mongodProcess.stderr)));
	errstream.on('data', function (chunk) {
		this.log.warn(chunk);
	}.bind(this));
	errstream.on('end', function () {
		if (!this.expectExit)
			this.log.fatal("Mongodb Quit");
		this.eventer.emit('mongoexit');
	}.bind(this));
};

Server.prototype.stop = function (callback) {
	this.expectExit = true;
	this.eventer.on('mongoexit', function () {
		callback();
	});
	this.mongodProcess.kill();
};

exports.Server = Server;
