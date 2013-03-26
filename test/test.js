'use strict';
var packageRoot = '../';
var service = require(packageRoot + 'webservice/service');

describe('service', function(){
	it('Exports ServiceConfig', function(done){
		if(!service.ServiceConfig){
			throw "Server is not exporting server config.";
		}
		done();
	});
	describe('ServiceConfig()', function(){
		it('Creates a class which contains the host and the port (sc.host, sc.post) on which the server was created', function(done){
			var sc = new service.ServiceConfig();
			if(!sc || !sc.getAPIHost() || !sc.getAPIPort()){
				throw "ServiceConfig should construct an object in which Host and port should be defined.";
			}
			done();
		});
		describe('getAPIEndPoint()', function(){
			it('Returns a string containing the API Endpoint', function(done){
				var sc = new service.ServiceConfig();
				var str = sc.getAPIEndPoint();
				if(typeof str === "string"){
					done();
				}
				else{
					throw "Did not return string";
				}
			});
		});
	});
	describe('Http API', function(){
		describe('/version', function(){
			it('GET', function(done){
				var request = require('request');
				var ep = new service.ServiceConfig().getAPIEndPoint();
				var opt = {
					url: ep + "/version",
					method: 'GET'
				};
				request(opt, function(err, res, body){
					if(typeof body === "string"){
						done();
					}
					else{
						throw "API is expected to return string";
					}
				});
			});
		});
	});
});