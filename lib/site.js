"use strict";

var utils = require('./utils');
var express = require('express');
//var request = require('request');
var fs = require('fs');

/*
function API(logger, config)
{
	this.logger = logger;
	this.config =  config;
}

API.prototype.getVersion = function (callback) {
	var This = this;

	var url = This.config.uri + "/version";
	var opt = {
		"url": url,
		"method": 'GET'
	};
	if (This.config.tls) {
		opt.ca = this.config.tls.certifyingAuthorities;
	}
	This.logger.info(opt.method + " " + opt.url);
	request(opt, function (err, res, body) {
		callback(err, body);
	});
};
*/

function Server(config) {
	this.config = config;
	this.apiConfig = this.config.loadConfig(this.config.apiConfig);
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
		app.use(express.static(This.config.resolvePath(This.config.wwwRoot)));
		/*
		app.get('/', function (req, res) {
			(new API(This.log, This.apiConfig)).getVersion(function (err, version) {
				if (!err) {
					var output = ""; 
					output += "<script src='https://raw.github.com/emberjs/ember.js/release-builds/ember-1.0.0-rc.2.js'></script>";
					"<br>Website version = " + pacakgeConfig.version + "<br>" + "Webservice Version: " + version;
					res.send(output);
				}
				else {
					config.log.info(err);
					res.end();
				}
			});

		});
*/

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
