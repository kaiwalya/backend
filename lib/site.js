"use strict";

var utils = require('./utils');
var express = require('express');
var request = require('request');
var fs = require('fs');

function API(logger, parentConfig)
{
	this.logger = logger;
	this.config =  parentConfig.loadConfig('api');
}

API.prototype.getVersion = function (callback) {
	var This = this;

	var url = This.config.uri + "/version";
	var opt = {
		"url": url,
		"method": 'GET',
		"ca": this.config.certifyingAuthorities
	};
	This.logger.info(opt.method + " " + opt.url);
	request(opt, function (err, res, body) {
		callback(err, body);
	});
};

function Server(config) {
	this.parentConfig = config;
	this.config = this.parentConfig.loadConfig('site');
	this.apiConfig = this.parentConfig.loadConfig('api');
	this.guid = utils.generateUUID();
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
		app.get('/', function (req, res) {
			(new API(This.log, This.parentConfig)).getVersion(function (err, version) {
				if (!err) {
					res.send("<br>Website version = " + pacakgeConfig.version + "<br>" + "Webservice Version: " + version);
				}
				else {
					config.log.info(err);
					res.end();
				}
			});

		});

		if (config.secure) {
			var opt = {
				key: config.key,
				cert: config.certificate,
				ca: config.certifyingAuthorities
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
	This.server.listen(config.port, config.hostName, function () {
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
