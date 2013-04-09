"use strict";

var fs = require('fs');
var utils = require('./utils');
var restify = require('restify');

function Server(config) {
	this.config = config;
	this.guid = utils.generateUUID();
	this.log = this.config.log.child({id: this.guid});
}

Server.prototype.initialize = function (callback) {
	var This = this;
	fs.readFile(__dirname + '/../package.json', function (err, data) {
		if (err) {
			This.log.fatal("Coulnt read package.json");
			return callback(err);
		}
		var pacakgeConfig = JSON.parse(data.toString());
		This.log.info("Package version is: " + JSON.stringify(pacakgeConfig.version, null, 2));
		var serverOpt = {
			name: This.config.name,
			log: This.log
		};
		if (This.config.tls) {
			serverOpt.key = This.config.tls.key;
			serverOpt.certificate = This.config.tls.certificate;
			serverOpt.ca = This.config.tls.certifyingAuthorities;
		}
		This.server = restify.createServer(serverOpt);
		var server = This.server;
		server.pre(function (req, res, next) {
			req.log = req.log.child({req: req.getId()});
			req.log.info('starting');
			return next();
		});

		server.on('after', function (req, res, route, err) {
			var obj = {};
			if (err) {
				obj.err = err;
			}
			obj.route = route;
			obj.req = req.headers;
			obj.res = res.headers();
			req.log.info('complete', obj);
		});
		server.use(restify.gzipResponse());

		server.get('/version', function (req, res, next) {
			res.send(pacakgeConfig.version);
			return next();
		});
		callback();
	});
};

Server.prototype.start = function (callback) {
	var This = this;
	this.server.listen(this.config.port, this.config.hostName, undefined, function () {
		This.log.info("Ready: " + This.config.uri);
		callback();
	});
};

Server.prototype.stop = function (callback) {
	//TODO: Wait for current connections to die
	this.log.warn("TODO: Wait for current connections to die");
	this.server.close(callback);
};

exports.Server = Server;
