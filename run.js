var Config = require('./lib/config').Config;
var API = require('./lib/service').Server;
var Site = require('./lib/site').Server;

setTimeout(function () {
	var config = new Config();
	var api = new API(config);
	var site = new Site(config);
	api.start(function (err) {
		if (err) {
			config.loadConfig('api').log.fatal('API Server Couldnt start: ' + JSON.stringify(err));
			throw new Error(err);
		}
		site.start(function (err) {
			if (err) {
				config.loadConfig('api').log.fatal('API Server Couldnt start: ' + JSON.stringify(err));
				throw new Error(err);
			}
		});
	});
});
