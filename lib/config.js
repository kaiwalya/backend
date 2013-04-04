'use strict';

var nconf = require('nconf');
var fs = require('fs');
var bunyan = require('bunyan');
var path = require('path');

nconf.argv().env();

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

var getPath = function (filename, configDir) {
	if (filename.indexOf('/') === 0) {
		return filename;
	}
	else if (configDir) {
		return path.normalize(path.join(configDir, filename));
	}
	else {
		throw new Error("Illegal call to getPath(" + filename + ", " + configDir + ")");
	}
};

var fileConfigToCodeConfig = function (fileConfig, configDir) {
	var ret = {};
	var readInnerConfig = function (innerConfig) {
		var retInner = {};
		retInner.name = innerConfig.name;
		retInner.secure = innerConfig.secure;
		retInner.hostName = innerConfig.hostName;
		retInner.port = innerConfig.port;
		if (retInner.secure) {
			retInner.certificate = fs.readFileSync(getPath(innerConfig.tlsInfo.certificateFile, configDir)).toString();
			retInner.key = fs.readFileSync(getPath(innerConfig.tlsInfo.keyFile, configDir)).toString();
			retInner.certifyingAuthorities = [];
			for (var i in innerConfig.tlsInfo.certifyingAuthorities) {
				var fname = innerConfig.tlsInfo.certifyingAuthorities[i];
				retInner.certifyingAuthorities.push(fs.readFileSync(getPath(fname, configDir)).toString());
			}
		}
		retInner.uri = makeURL(retInner);
		var logger = bunyan.createLogger({
			name: innerConfig.name,
			streams: [
				{
					path: getPath(innerConfig.logFile, configDir)
				}
			],
			level: innerConfig.logLevel
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

function Config(obj) {
	var ptype = typeof obj;
	this.configurationDir = "";
	if (ptype === 'object') {
		this.config = obj;
	}
	else if (ptype === 'string' || ptype === 'undefined') {
		var configurationFile;
		if (ptype) {
			configurationFile = __dirname + "/../../config/debug.json";
			if (nconf.get('configurationFile')) {
				configurationFile = nconf.get('configurationFile');
			}
		}
		else {
			configurationFile = obj;
		}
		configurationFile = path.normalize(configurationFile);
		this.configurationDir = path.dirname(configurationFile);
		this.config = JSON.parse(fs.readFileSync(configurationFile).toString());
	}
	this.codeConfig = fileConfigToCodeConfig(this.config, this.configurationDir);
}


Config.prototype.loadConfig = function (who) {
	if (who === 'api') {
		return this.codeConfig.api;
	}
	else if (who === 'site') {
		return this.codeConfig.site;
	}
	else {
		throw new Error('Unknown config client ' + who);
	}
};

exports.Config = Config;
