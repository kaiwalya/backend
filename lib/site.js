"use strict";


/////////////////
//Configuration//
/////////////////
var Logger =  require('bunyan');

var log = new Logger({name: "Website"});
log.level(Logger.DEBUG);
log.debug('Logging Initialized');

var pacakgeConfig = require('../package.json');
log.info("Package version is: %s", JSON.stringify(pacakgeConfig.version, null, 2));

var apiHost = "127.0.0.1";
var apiPort = 8474;
var port = 8475;

var express = require('express');
var request = require('request');

var app = express();

function API(apiHost, apiPort, logger)
{
	this.apiHost = apiHost;
	this.apiPort = apiPort;
	this.logger = logger;
	this.apiEP = "http://" + apiHost + ":" + apiPort;
}

API.prototype.getVersion = function (callback) {
	var This = this;

	var url = This.apiEP + "/version";
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
	(new API(apiHost, apiPort, log)).getVersion(function (err, version) {
		if (!err) {
			res.send("Website version = " + pacakgeConfig.version + "<br>" + "Webservice Version: " + version);
		}
		else {
			res.end();
		}
	});

});


app.listen(port);
log.info("Server started at http://127.0.0.1:" + port);

