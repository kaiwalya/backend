var async = require('async');
var Config = require('./lib/config').Config;

/*
var checkErr = function (err) {
	if (err) {
		throw err;
	}
};
*/

var servers = [];

exports.start = function (callback) {
	var config = (new Config()).rootConfig();
	//var len = config.metaConfig.linearOrdering;
	async.eachSeries(config.metaConfig.linearOrdering, function (con, cb) {
		//console.log(con);
		var server = new con.handler(con);
		servers.push(server);
		server.initialize(function (err) {
			cb(err);
		});
	}, function (err) {
		if (err) throw err;
		async.eachSeries(servers, function (server, cb) {
			server.start(function (err) {
				cb(err);
			});
		}, function (err) {
			callback(err);
		});
	});
};

exports.stop = function (cb) {
	//Test code to stop all servers
	async.eachSeries(servers, function (server, next) {
		server.stop(next);
	}, function (err) {
		cb(err);
	});
};
