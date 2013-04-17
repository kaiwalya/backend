"use strict";

var utils = require('./utils');
var express = require('express');
//var request = require('request');
var fs = require('fs');

function Server(config) {
	this.config = config;
	this.guid = utils.generateServerUUID();
	this.log = this.config.log.child({id: this.guid});
}

Server.prototype.initialize = function (callback) {
	var config = this.config;
	var This = this;
	fs.readFile(__dirname + '/../package.json', function (err, data) {
		if (err) {
			This.log.fatal("Coulnt read package.json");
			return callback(err);
		}
		var pacakgeConfig = JSON.parse(data.toString());
		This.log.info("Package version is: " + JSON.stringify(pacakgeConfig.version, null, 2));
		var app = express();
		app.get('/apiRoot', function (req, res) {
			res.send(This.config.apiRoot);
		});
		app.use(express.static(This.config.resolvePath(This.config.wwwRoot)));

		if (config.tls) {
			var opt = {
				key: config.tls.key,
				cert: config.tls.certificate,
				ca: config.tls.certifyingAuthorities
			};
			This.server = require('https').createServer(opt, app);
		}
		else {
			This.server = require('http').createServer(app);
		}

		callback();
	});
};

Server.prototype.start = function (callback) {
	var config = this.config;
	var This = this;
	This.server.listen(config.port, config.hostName, undefined, function () {
		This.log.info("Ready: " + config.uri);
		callback();
	});
};

Server.prototype.stop = function (callback) {
	//TODO: Wait for current connections to die
	this.log.warn("TODO: Wait for current connections to die");
	this.server.close(callback);
};


exports.Server = Server;
