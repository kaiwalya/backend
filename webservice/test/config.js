'use strict';

var conf = require('../lib/config');


var config = new conf.Configuration();

describe('class Configuration', function(){
	describe('getAPIHost()', function(){
		it('Returns the API Host', function(done){
			config.getAPIHost();
			done();
		});
	});
});