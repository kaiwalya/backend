"use strict";

var fs = require('fs');
var utils = require('./utils');
var restify = require('restify');
var async = require('async');

var packageRoot = __dirname + "/..";

var libPath = function (modulePath) {
	return packageRoot + '/lib' + modulePath;
};

var loadLib = function (modulePath) {
	return require(libPath(modulePath));
};

var AM = loadLib('/accounts/AccountManager');
var AccountManager = AM.AccountManager;
var MongooseConnection = AM.MongooseConnection;

function Server(config) {
	this.config = config;
	this.guid = utils.generateServerUUID();
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
		},
		//TODO: X-Site Scripting Support, revit this at some point
		function (req, res, next) {
			res.header('Access-Control-Allow-Origin', 'https://localhost:8475');
			if (req.headers['access-control-request-headers']) {
				res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
			}
			next();
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

		server.use(restify.gzipResponse());

		var mongooseConnection;
		var confirmMongooseConnection = function (callback) {
			if (!mongooseConnection) {
				new MongooseConnection(function (err, mc) {
					if (err) return callback(err);
					mongooseConnection = mc;
					return callback(null, mongooseConnection);
				}, This.config.mongo, 'auth', This.log.child({module: "AccountManager"}));
			}
			else {
				callback(null, mongooseConnection);
			}
		};
		var createAM = function (req, callback) {
			confirmMongooseConnection(function (err, mc) {
				if (err) return callback(err);
				new AccountManager(callback, mc, req.log.child({module: "AccountManager"}));
			});
		};



		////////////////////////////
		//Everyone
		////////////////////////////
		server.get('/version', function (req, res, next) {
			res.send(pacakgeConfig.version);
			return next();
		});

		////////////////////////////
		//Humans
		////////////////////////////
		server.post('/accounts', restify.bodyParser({mapParams: false}), function (req, res, next) {
			//The body parser above should convert the form data parameters into json object
			if (!req.body || !req.body.uname || !req.body.pass) {
				return next(new restify.HttpError({statusCode: 400, message: 'Missing parameters'}));
			}
			createAM(req, function (err, am) {
				if (err) return next(new restify.InternalError());
				am.createAccount(function (err, id) {
					if (err) {
						if (err instanceof AM.UserExists) {
							return next(new restify.ConflictError('Username Taken'));
						}
						return next(new restify.InternalError());
					}
					res.send(201, {accountID: id});
					return next();
				}, req.body.uname, req.body.pass);
			});
		});

		server.post('/sessions', restify.bodyParser({mapParams: false}), function (req, res, next) {
			//The body parser above should convert the form data parameters into json object
			if (!req.body || !req.body.uname || !req.body.pass) {
				return next(new restify.HttpError({statusCode: 400, message: 'Missing parameters'}));
			}
			createAM(req, function (err, am) {
				if (err) return next(new restify.InternalError());
				am.login(function (err, id) {
					if (err) {
						if (err instanceof AM.IncorrectCredentials) {
							return next(new restify.ConflictError('Username or password incorrect'));
						}
						return next(new restify.InternalError());
					}
					var ret = {sessionID: id};
					res.send(201, ret);
					return next();
				}, req.body.uname, req.body.pass);
			});
		});

		////////////////////////////
		//Registered Users
		////////////////////////////

		//Authorization filter
		server.use(function (req, res, next) {
			var authorization = req.headers['authorization'];
			var tokenPrefix = 'Celebration ';
			if (!authorization || typeof authorization !== 'string' || authorization.indexOf(tokenPrefix) !== 0) {
				return next(new restify.RestError({
					statusCode: 401,
					message: 'Required authentication header missing'
				}));
			}
			var token = authorization.replace(tokenPrefix, '');
			createAM(req, function (err, am) {
				if (err) return next(new restify.InternalError());
				am.findSession(function (err, allSessions) {
					if (err) {
						if (err instanceof AM.IncorrectCredentials)
							return next(new restify.RestError({
								statusCode: 401,
								message: 'Invalid Session'
							}));
						return next(new restify.InternalError());
					}
					req.context.user = {
						session: token,
						sessions: allSessions
					};
					req.log = req.log.child({"sessionID": token});
					req.log.info("User Authorized");
					return next();
				}, token);
			});
		});

		server.head('/sessions', function (req, res, next) {
			res.send(200);
			return next();
		});
		server.get('/sessions', function (req, res, next) {
			var ret = {sessions: []};
			req.context.user.sessions.forEach(function (session) {
				ret.sessions.push({
					sessionID: session
				});
			});
			res.send(ret);
			return next();
		});

		server.del('/sessions', function (req, res, next) {
			createAM(req, function (err, am) {
				if (err) return next(new restify.InternalError());
				async.eachSeries(req.context.user.sessions, function (session, cb) {
					am.logout(cb, session);
				}, function (err) {
					if (err) return next(new restify.InternalError());
					res.send(200);
					return next();
				});
			});
		});

		server.head('/sessions/:sessionID', function (req, res, next) {
			if (req.context.user.sessions.indexOf(req.params.sessionID) === -1) {
				req.log.warn('session %s tried to incorrectly read session %s', req.context.user.session, req.params.sessionID);
				return next(new restify.ResourceNotFoundError());
			}
			res.send(200);
			return next();
		});
		server.get('/sessions/:sessionID', function (req, res, next) {
			if (req.context.user.sessions.indexOf(req.params.sessionID) === -1) {
				req.log.warn('session %s tried to incorrectly read session %s', req.context.user.session, req.params.sessionID);
				return next(new restify.ResourceNotFoundError());
			}
			res.send({sessionID: req.params.sessionID});
			return next();
		});

		server.del('/sessions/:sessionID', function (req, res, next) {
			if (req.context.user.sessions.indexOf(req.params.sessionID) === -1) {
				return next(new restify.ResourceNotFoundError());
			}
			createAM(req, function (err, am) {
				if (err) return next(new restify.InternalError());
				am.logout(function (err) {
					if (err) return next(new restify.InternalError());
					res.send(200);
					return next();
				}, req.params.sessionID);
			});
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
