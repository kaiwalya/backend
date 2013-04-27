'use strict';

var nconf = require('nconf');
var fs = require('fs');
var bunyan = require('bunyan');
var path = require('path');

nconf.argv().env();

var makeURL = function (cfg) {
	var schema;
	if (cfg.tls) {
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

var findHandler = function (_handler, configDir) {
	var ret = require(getPath(_handler.module, configDir), configDir);
	if (_handler.namespace) {
		_handler.namespace.forEach(function (str) {
			ret = ret[str];
		});
	}
	return ret;
};

var fileConfigToCodeConfig = function (parentConfig, fileConfig, configDir) {
	var ret = {};
	var readInnerConfig = function (name, innerConfig) {
		var retInner = {};
		retInner.name = name;
		for (var prop in innerConfig) {
			if (prop === '_handler') {
				retInner.handler = findHandler(innerConfig._handler, configDir);
			}
			else if (prop === '_tls') {
				retInner.tls = {
					certificate: fs.readFileSync(getPath(innerConfig._tls.certificateFile, configDir)).toString(),
					key: fs.readFileSync(getPath(innerConfig._tls.keyFile, configDir)).toString(),
					certifyingAuthorities: []
				};
				for (var i in innerConfig._tls.certifyingAuthorities) {
					var fname = innerConfig._tls.certifyingAuthorities[i];
					retInner.tls.certifyingAuthorities.push(fs.readFileSync(getPath(fname, configDir)).toString());
				}
			}
			else if (prop === '_log') {
				var logger = bunyan.createLogger({
					name: name,
					streams: [
						{
							path: getPath(innerConfig._log.filePath, configDir)
						}
					],
					level: innerConfig._log.level
				});
				retInner.log = logger;
			}
			else if (prop.indexOf('_') === 0) {
				console.log('Unknown dynamic param: ' + prop);
			}
			else {
				retInner[prop] = innerConfig[prop];
			}
		}

		if (retInner.hostName || retInner.port) {
			retInner.uri = makeURL(retInner);
		}

		retInner.loadConfig = function (name) {
			return parentConfig.loadConfig(name);
		};

		retInner.resolvePath = function (path) {
			return parentConfig.resolvePath(path);
		};
		return retInner;
	};
	for (var c in fileConfig) {
		if (c.indexOf('_') !== 0)
			ret[c] = readInnerConfig(c, fileConfig[c]);
		else {
			if (c === '_metaConfig') {
				ret.metaConfig = {};
				var sm = fileConfig._metaConfig;
				var dm = ret.metaConfig;
				for (var m in sm) {
					if (m === '_linearOrdering') {
						dm.linearOrdering = [];
						for (c in sm[m]) {
							dm.linearOrdering[c] = ret[sm[m][c]];
						}
					}
					else {
						dm[m] = sm[m];
					}
				}
			}
			else {
				throw new Error("Unknown dynamic directive in config");
			}
		}
	}

	ret.loadConfig = function (name) {
		return parentConfig.loadConfig(name);
	};


	return ret;
};

function Config(obj, dir) {
	var ptype = typeof obj;
	if (ptype === 'object') {
		this.config = obj;
		if (dir) {
			this.configurationDir = dir;
		}
		else {
			this.configurationDir = ".";
		}
	}
	else if (ptype === 'string' || ptype === 'undefined') {
		var configurationFile;
		if (!obj) {
			//If nothing is defined look in current directory by default
			if (nconf.get('configurationFile')) {
				configurationFile = nconf.get('configurationFile');
			}
			else {
				configurationFile = "./config/debug.json";
			}
		}
		else {
			configurationFile = obj;
		}
		configurationFile = path.resolve(path.normalize(configurationFile));
		this.configurationDir = path.dirname(configurationFile);
		this.config = JSON.parse(fs.readFileSync(configurationFile).toString());
		//console.log(configurationFile, this.configurationDir, this.config);
	}
	this.codeConfig = fileConfigToCodeConfig(this, this.config, this.configurationDir);
}


Config.prototype.resolvePath = function (path) {
	return getPath(path, this.configurationDir);
};

Config.prototype.rootConfig = function () {
	return this.codeConfig;
};

Config.prototype.loadConfig = function (who) {
	if (this.codeConfig[who]) {
		return this.codeConfig[who];
	}
	else {
		throw new Error('Unknown config ' + who);
	}
};

exports.Config = Config;
