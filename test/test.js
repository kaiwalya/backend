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


describe('module service (' + apiPath + '),', function () {
	var service;
	it('service = require(' + packageRoot + apiPath + ')', function () {
		service = require(packageRoot + apiPath);
	});
	var Server;
	it('Exports service.Server', function () {
		Server = service.Server;
		assert.ok(Server, "Server not exported");
	});
	describe('class Server,', function () {
		it('Is a function', function () {
			assert.strictEqual(typeof Server, 'function');
		});
		it('Which accepts a single parameter', function () {
			assert.strictEqual(Server.length, 1);
		});
		var server;
		it('Constructs an object of class Server', function () {
			server = new Server(new Config());
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

		describe('Http API', function () {
			beforeEach(function (done) {
				server = new Server(new Config());
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
						this.timeout(2000 + maxParellel);
						var request = require('request');
						var ep = server.config.uri;
						var opt = {
							url: ep + "/version",
							method: 'GET',
							pool: {maxSockets: 1},
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
	});
});

describe('module site (' + sitePath + '),', function () {
	var site;
	it('site = require(' + packageRoot + sitePath + ')', function () {
		site = require(packageRoot + sitePath);
	});
	var SiteServer;
	it('Exports site.Server', function () {
		SiteServer = site.Server;
		assert.ok(SiteServer, "Server not exported");
	});
	describe('class Server,', function () {
		it('Is a function', function () {
			assert.strictEqual(typeof SiteServer, 'function');
		});
		it('Which accepts a single parameter', function () {
			assert.strictEqual(SiteServer.length, 1);
		});
		var server;
		var apiServer;
		it('Constructs an object of class Server', function () {
			server = new SiteServer(new Config());
			assert.strictEqual(server.constructor, SiteServer);
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

		describe('Routes,', function () {
			beforeEach(function (done) {
				var APIServer = require(packageRoot + apiPath).Server;
				apiServer = new APIServer(new Config());
				server = new SiteServer(new Config());
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
					done();
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
	});
});
