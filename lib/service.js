"use strict";

var utils = require('./utils');
var restify = require('restify');
var async = require('async');

/*
var packageRoot = __dirname + "/..";

var libPath = function (modulePath) {
	return packageRoot + '/lib' + modulePath;
};

var loadLib = function (modulePath) {
	return require(libPath(modulePath));
};
*/

function Server(config) {
	this.config = config;
	this.guid = utils.generateServerUUID();
	this.log = this.config.log.child({id: this.guid});
}

Server.prototype.initialize = function (callback) {
	var This = this;
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
	},
	//TODO: X-Site Scripting Support, revit this at some point
	function (req, res, next) {
		res.header('Access-Control-Allow-Origin', 'https://localhost:8475');
		if (req.headers['access-control-request-headers']) {
			res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
		}
		return next();
	}
	);

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

	server.on('uncaughtException', function (req, res, route, err) {
		var msg = JSON.stringify({
			reqHeaders: req.headers,
			resHeaders: res.headers,
			route: route,
			err: err.stack
		});

		console.log(err.stack);
		This.log.fatal(msg);
	});

	var ctx = {
		server: server,
		log: This.log,
		config: This.config
	};
	This.uninstallers = [];
	if (This.config.routes) {
		return async.eachSeries(This.config.routes, function (routeInstallerJSFile, next) {
			This.log.info('Installing Routes: ' + routeInstallerJSFile);
			routeInstallerJSFile = This.config.resolvePath(routeInstallerJSFile);
			return require(routeInstallerJSFile).installRoutes(ctx, function (err, uninstaller) {
				if (err) return next(err);
				if (uninstaller) {
					This.uninstallers.push(uninstaller);
				}
				return next(err);
			});
		}, function (err) {
			if (err)
				This.log.fatal('Error Installing Routes');
			return callback(err);
		});
	}
	else
		return callback();
};

Server.prototype.start = function (callback) {
	var This = this;
	return this.server.listen(this.config.port, this.config.hostName, undefined, function () {
		This.log.info("Ready: " + This.config.uri);
		return callback();
	});
};

Server.prototype.stop = function (callback) {
	//TODO: Wait for current connections to die
	var This = this;
	this.log.warn("TODO: Wait for current connections to die");
	return async.eachSeries(This.uninstallers, function (uninstaller, next) {
		return uninstaller(next);
	}, function (err) {
		This.server.close(function () {
			if (err) return callback(err);
			return callback();
		});
	});
};

exports.Server = Server;
