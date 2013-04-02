'use strict';

var nconf = require('nconf');
var fs = require('fs');
var bunyan = require('bunyan');
var path = require('path');

nconf.argv().env();

var configurationFile = __dirname + "/../../config/debug.json";
if (nconf.get('configurationFile')) {
	configurationFile = nconf.get('configurationFile');
}
configurationFile = path.normalize(configurationFile);
var configurationDir = path.dirname(configurationFile);
var config = require(configurationFile);
if (!config) {
	throw new Error('Couldnt find configuration');
}

var makeURL = function (cfg) {
	var schema;
	if (cfg.secure) {
		schema = "https";
	}
	else {
		schema = "http";
	}

	return schema + "://" + cfg.hostName + ":" + cfg.port;
};

var getPath = function (filename) {
	if (filename.indexOf('/') === 0) {
		return filename;
	}
	else {
		return path.normalize(path.join(configurationDir, filename));
	}
};

var fileConfigToCodeConfig = function (fileConfig) {
	var ret = {};
	var readInnerConfig = function (innerConfig) {
		var retInner = {};
		retInner.name = innerConfig.name;
		retInner.secure = innerConfig.secure;
		retInner.hostName = innerConfig.hostName;
		retInner.port = innerConfig.port;
		if (retInner.secure) {
			retInner.certificate = fs.readFileSync(getPath(innerConfig.tlsInfo.certificateFile)).toString();
			retInner.key = fs.readFileSync(getPath(innerConfig.tlsInfo.keyFile)).toString();
			retInner.certifyingAuthorities = [];
			for (var i in innerConfig.tlsInfo.certifyingAuthorities) {
				var fname = innerConfig.tlsInfo.certifyingAuthorities[i];
				retInner.certifyingAuthorities.push(fs.readFileSync(getPath(fname)).toString());
			}
		}
		retInner.uri = makeURL(retInner);
		var logger = bunyan.createLogger({
			name: innerConfig.name,
			streams: [
				{
					path: getPath(innerConfig.logFile)
				}
			]
		});
		retInner.log = logger;
		return retInner;
	};
	if (fileConfig.api) {
		ret.api = readInnerConfig(fileConfig.api);
	}
	if (fileConfig.site) {
		ret.site = readInnerConfig(fileConfig.site);
	}
	return ret;
};

var codeConfig = fileConfigToCodeConfig(config);

function loadConfig(who) {
	if (who === 'api') {
		return codeConfig.api;
	}
	else if (who === 'site') {
		return codeConfig.site;
	}
	else {
		throw new Error('Unknown config client ' + who);
	}
}

exports.loadConfig = loadConfig;
