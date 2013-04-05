var Config = require('./lib/config').Config;
var API = require('./lib/service').Server;
var Site = require('./lib/site').Server;

var checkErr = function (err) {
	if (err) {
		throw err;
	}
};

setTimeout(function () {
	var config = new Config();
	var api = new API(config);
	var site = new Site(config);
	api.initialize(function (err) {
		checkErr(err);
		site.initialize(function (err) {
			checkErr(err);
			api.start(function (err) {
				checkErr(err);
				site.start(function (err) {
					checkErr(err);
				});
			});
		});
	});
});
