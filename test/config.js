'use strict';

var conf = require('../lib/config');


describe('module config', function () {
	it('Manages configurations for the website, webapi and the authorization. It also makes ', function (done) {
		done();
	});
	describe('function loadConfig(who)', function () {
		it('Constructs a new configuration for use by "who". "who" can be "site" or "api"', function (done) {
			var configSite = new conf.loadConfig('site');
			var configAPI = new conf.loadConfig('api');
			var ensureType = function (objName, member, obj, typeExpected) {
				var typeGot = typeof obj[member];
				if (typeGot !== typeExpected) {
					throw new Error("typeof (" + objName + "." + member + ") is [" + typeGot + "] expected [" + typeExpected + "]");
				}
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
