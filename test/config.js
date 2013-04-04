'use strict';

var assert = require('assert');

describe('module config (lib/config.js),', function () {
	var config;
	it('config = require("../lib/config")', function (done) {
		config = require('../lib/config');
		done();
	});
	var Config;
	it('Exports config.Config', function (done) {
		if (!config.Config) throw new Error();
		Config = config.Config;
		done();
	});
	describe('class Config,', function () {
		it('Is a function', function (done) {
			assert.strictEqual(typeof Config, 'function');
			return done();
		});

		it('Constructs an object of class Config', function (done) {
			var conf = new Config();
			assert.strictEqual(conf.constructor, Config);
			return done();
		});

		describe('function loadConfig(who),', function () {
			it('Constructs a new configuration for use by "who". "who" can be "site" or "api"', function (done) {
				var configSite = (new Config()).loadConfig('site');
				var configAPI = (new Config()).loadConfig('api');
				var ensureType = function (objName, member, obj, typeExpected) {
					var typeGot = typeof obj[member];
					assert.strictEqual(typeGot, typeExpected, "typeof (" + objName + "." + member + ") is [" + typeGot + "] expected [" + typeExpected + "]");
				};
				var checkConfig = function (configName, config) {
					ensureType(configName, "secure", config, 'boolean');
					ensureType(configName, "hostName", config, 'string');
					ensureType(configName, "port", config, 'number');
					if (config.secure) {
						ensureType(configName, "certificate", config, 'string');
						ensureType(configName, "key", config, 'string');
					}
				};
				checkConfig('configAPI', configAPI);
				checkConfig('configSite', configSite);
				done();
			});
		});
	});
});

