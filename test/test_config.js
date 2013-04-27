'use strict';

var assert = require('assert');

exports.TestExport = {};

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
		var config;
		beforeEach(function (done) {
			var testConfig = {
				a: {},
				b: {},
				c: {
					_handler: {
						module: __filename,
						namespace: ["TestExport"]
					},
					_tls: {
						certificateFile: "../config/certs/localhost.crt",
						keyFile: "../config/certs/localhost.key",
						certifyingAuthorities: ["../config/certs/localhost.crt"]
					}
				},
				_metaConfig: {
					_linearOrdering: ["a", "b", "c"],
					other: true
				}
			};
			config = new Config(testConfig, __dirname);
			done();
		});

		/*
		var ensureType = function (objName, member, obj, typeExpected) {
			var typeGot = typeof obj[member];
			assert.strictEqual(typeGot, typeExpected, "typeof (" + objName + "." + member + ") is [" + typeGot + "] expected [" + typeExpected + "]");
		};
		*/

		it('Is a function', function (done) {
			assert.strictEqual(typeof Config, 'function');
			return done();
		});

		it('Constructs an object of class Config', function (done) {
			var conf = new Config();
			assert.strictEqual(conf.constructor, Config);
			return done();
		});

		it('Can accept configuration objects in the constructor', function () {
			assert.strictEqual(config.constructor, Config);
		});

		describe('function loadConfig(who),', function () {
			it('Finds configuration for for first level objects', function () {
				config.loadConfig('a');
				config.loadConfig('b');
				config.loadConfig('c');
			});
		});


		it('It dynamically replaces _metaConfig with metaConfig', function () {
			config.loadConfig('metaConfig');
		});
	});
});

