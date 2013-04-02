'use strict';
var packageRoot = '../';

describe('service', function () {
	var service = require(packageRoot + 'lib/service');
	it('Exports config', function (done) {
		if (!service.config) {
			throw new Error("Server is not exporting server config.");
		}
		done();
	});
	describe('Http API', function () {
		describe('/version', function () {
			it('GET', function (done) {
				var request = require('request');
				var ep = service.config.uri;
				var opt = {
					url: ep + "/version",
					method: 'GET'
				};
				request(opt, function (err, res, body) {
					if (typeof body === "string") {
						done();
					}
					else {
						throw "API is expected to return string";
					}
				});
			});
		});
	});
});

describe('Website', function () {
	var site = require(packageRoot + 'lib/site');
	it('Launches a server', function (done) {
		if (!site.config) {
			throw new Error("Site should return config");
		}
		done();
	});
	it('Returns success fully to a GET /', function (done) {
		var request = require('request');
		var ep = site.config.uri;
		var opt = {
			url: ep + "/",
			method: 'GET',
			ca: site.config.certifyingAuthorities
		};
		request(opt, function (err, res, body) {
			if (err) {
				site.config.log.info(err);
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
