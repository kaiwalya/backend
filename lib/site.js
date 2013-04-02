"use strict";


/////////////////
//Configuration//
/////////////////
var config =  require('./config.js').loadConfig('site');
var log = config.log;

var pacakgeConfig = require('../package.json');
log.info("Package version is: %s", JSON.stringify(pacakgeConfig.version, null, 2));

var express = require('express');
var request = require('request');

var app = express();

function API(logger)
{
	this.logger = logger;
	this.uri = require('./config.js').loadConfig('api').uri;
}

API.prototype.getVersion = function (callback) {
	var This = this;

	var url = This.uri + "/version";
	var opt = {
		"url": url,
		"method": 'GET'
	};

	This.logger.info(opt.method + " " + opt.url);
	request(opt, function (err, res, body) {
		callback(err, body);
	});
};

app.get('/', function (req, res) {
	(new API(log)).getVersion(function (err, version) {
		if (!err) {
			res.send("Website version = " + pacakgeConfig.version + "<br>" + "Webservice Version: " + version);
		}
		else {
			res.end();
		}
	});

});

var server;
if (config.secure) {
	var opt = {
		key: config.key,
		cert: config.certificate
	};
	server = require('https').createServer(opt, app);
}
else {
	server = require('http').createServer(opt, app);
}

server.listen(config.port, config.hostName);
log.info("Ready: " + config.uri);
exports.config = config;

