'use strict';
var packageRoot = '../';
var service = require(packageRoot + 'lib/service');

describe('service', function () {
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
				var ep = service.config.getEndpoint();
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