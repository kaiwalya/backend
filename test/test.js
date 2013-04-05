'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var packageRoot = path.normalize(__dirname + '/../');

//We ensure that config tests run earlier
require('./config.js');
var Config = require(packageRoot + "lib/config").Config;
var packageConfig = JSON.parse(fs.readFileSync(packageRoot + "package.json").toString());
var apiPath = "lib/service";
var sitePath = "lib/site";

var perServerTest = function (Server) {
	it('Is a function', function () {
		assert.strictEqual(typeof Server, 'function');
	});

	it('Which accepts a single parameter', function () {
		assert.strictEqual(Server.length, 1);
	});

};

var perServerConfigStartStopTest = function (Server, name, config) {
	describe('Works in ' + name + ' config ', function () {
		var server;
		it('Constructs an object of class Server', function () {
			server = new Server(config);
			assert.strictEqual(server.constructor, Server);
		});
		describe('function initialize(callback),', function () {
			it('Initializes the routes', function (done) {
				server.initialize(function (err) {
					if (err) throw err;
					done();
				});
			});
		});
		describe('function start(callback),', function () {
			it('Starts the server', function (done) {
				server.start(function (err) {
					if (err) throw err;
					done();
				});
			});
		});

		describe('function stop(callback),', function () {
			it('Stops the server', function (done) {
				server.stop(function (err) {
					if (err) throw err;
					done();
				});
			});
		});
	});
};


//Simple class which owns a list of Configs and a Server Class.
//it calls any function passed to testWithFunction against all configs.
function ServerConfigTester(Server, arrConfigs) {
	this.Server = Server;
	this.arrConfigs = arrConfigs;
}

ServerConfigTester.prototype.testWithFunction = function (testFunc) {
	this.arrConfigs.forEach(function (config) {
		testFunc(this.Server, config.name, config.config);
	}.bind(this));
};


var generateLocalhostConfig = function (name, port, secure) {
	var ret = {};
	ret.name = name;
	ret.hostName = "localhost";
	ret.port = port;
	ret.secure = secure;
	if (ret.secure) {
		ret.tlsInfo = {
			"certificateFile": __dirname + "/../../config/certs/localhost.crt",
			"keyFile": __dirname + "/../../config/certs/localhost.key",
			"certifyingAuthorities": [__dirname + "/../../config/certs/localhost.crt"]
		};
	}
	ret.logFile = __dirname + "/../../logs/" + name + ".log";
	ret.logLevel = "debug";
	return ret;
};

var usapicon = function (name) {return generateLocalhostConfig(name + "_TestInsecureAPI", 9999, false); };
var sapicon = function (name) {return generateLocalhostConfig(name + "_TestSecureAPI", 9999, true); };
var ussitecon = function (name) {return generateLocalhostConfig(name + "_TestInsecureSite", 10000, false); };
var ssitecon = function (name) {return generateLocalhostConfig(name + "_TestSecureSite", 10000, true); };

var getParentConfig = function (name, sapi, ssite) {
	var ret = {};
	ret.api = sapi ? sapicon(name) : usapicon(name);
	ret.site = ssite ? ssitecon(name): ussitecon(name);
	return new Config(ret);
};

describe('module service (' + apiPath + '),', function () {
	it('service = require(' + packageRoot + apiPath + ')', function () {
		require(packageRoot + apiPath);
	});
	it('Exports service.Server', function () {
		var service = require(packageRoot + apiPath);
		var Server = service.Server;
		assert.ok(Server, "Server not exported");
	});
	describe('class Server,', function () {
		var service = require(packageRoot + apiPath);
		var Server = service.Server;
		perServerTest(service.Server);
		var configArr = [
			{
				name: 'default',
				config: new Config()
			},
			{
				name: 'https',
				config: getParentConfig('api-https', true, false)
			},
			{
				name: 'http',
				config: getParentConfig('api-http', false, false)
			},
		];
		var testAPI = function (Server, name, config) {
			var server;
			describe('API ' + name, function () {
				beforeEach(function (done) {
					server = new Server(config);
					server.initialize(function () {
						server.start(function () {
							done();
						});
					});
				});
				afterEach(function (done) {
					server.stop(function () {
						done();
					});
				});
				describe('/version', function () {
					describe('GET', function () {
						it('Returns a string', function (done) {
							var request = require('request');
							var ep = server.config.uri;
							var opt = {
								url: ep + "/version",
								method: 'GET',
								ca: server.config.certifyingAuthorities
							};
							request(opt, function (err, res, body) {
								if (err) throw err;
								assert.strictEqual(typeof body, 'string');
								assert.strictEqual(JSON.parse(body), packageConfig.version);
								done();
							});
						});
						var maxParellel = 1000;
						it('Withstands alteast ' + maxParellel + ' parellel requests', function (done) {
							this.timeout(300 + Math.floor(maxParellel * 1.5));
							var request = require('request');
							var ep = server.config.uri;
							var opt = {
								url: ep + "/version",
								method: 'GET',
								ca: server.config.certifyingAuthorities
							};
							var asks = maxParellel;
							var ans = maxParellel;
							var onRequestComplete = function (err, res, body) {
								if (err) throw err;
								assert.strictEqual(typeof body, 'string');
								assert.strictEqual(JSON.parse(body), packageConfig.version);
								ans = ans - 1;
								if (ans === 0) {
									done();
								}
							};
							while (asks > 0) {
								request(opt, onRequestComplete);
								asks = asks - 1;
							}
						});
					});
				});
			});
		};


		var configTester = new ServerConfigTester(Server, configArr);
		configTester.testWithFunction(perServerConfigStartStopTest);
		configTester.testWithFunction(testAPI);
	});
});

describe('module site (' + sitePath + '),', function () {
	it('site = require(' + packageRoot + sitePath + ')', function () {
		require(packageRoot + sitePath);
	});
	it('Exports site.Server', function () {
		var site = require(packageRoot + sitePath);
		var SiteServer = site.Server;
		assert.ok(SiteServer, "Server not exported");
	});
	describe('class Server,', function () {
		var site = require(packageRoot + sitePath);
		perServerTest(site.Server);

		var configArr = [
			{
				name: 'default',
				config: new Config()
			},
			{
				name: 'http site w/ http service',
				config: getParentConfig('site-http-api-http', false, false)
			},
			{
				name: 'http site w/ https service',
				config: getParentConfig("site-http-api-https", true, false)
			},
			{
				name: 'https site w/ http service',
				config: getParentConfig("site-https-api-http", false, true)
			},
			{
				name: 'https site w/ https service',
				config: getParentConfig("site-https-api-https", true, true)
			},
		];
		var server;
		var apiServer;
		var testRoutes = function (Server, name, config) {
			describe('Routes ' + name + ',', function () {
				beforeEach(function (done) {
					var api = require(packageRoot + apiPath);
					apiServer = new api.Server(config);
					server = new Server(config);
					apiServer.initialize(function () {
						server.initialize(function () {
							apiServer.start(function () {
								server.start(function () {
									done();
								});
							});
						});
					});
				});
				afterEach(function (done) {
					server.stop(function () {
						apiServer.stop(function () {
							done();
						});
					});
				});
				describe('/', function () {
					it('Returns successfully', function (done) {
						var request = require('request');
						var ep = server.config.uri;
						var opt = {
							url: ep + "/",
							method: 'GET',
							ca: server.config.certifyingAuthorities
						};
						request(opt, function (err, res, body) {
							if (err) {
								server.config.log.info(err);
								throw new Error(err);
							}
							var typeGot = typeof body;
							var typeExpected = 'string';
							if (typeGot !== typeExpected) {
								throw new Error("Expected to return [" + typeExpected + "] got [" + typeGot + "] instead.");
							}
							done();
						});
					});
				});
			});
		};
		var configTester = new ServerConfigTester(site.Server, configArr);
		configTester.testWithFunction(perServerConfigStartStopTest);
		configTester.testWithFunction(testRoutes);
	});
});
