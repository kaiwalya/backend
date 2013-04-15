"use strict";

var fs = require('fs');
var utils = require('./utils');
var restify = require('restify');

var packageRoot = __dirname + "/../..";

var libPath = function (modulePath) {
	return packageRoot + '/backend/lib' + modulePath;
};

var loadLib = function (modulePath) {
	return require(libPath(modulePath));
};

var AM = loadLib('/accounts/AccountManager');
var AccountManager = AM.AccountManager;


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
				return next(new restify.HttpError({statusCode: 400}));
			}
			var am = new AccountManager(function (err) {
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
			}, This.config.mongo, 'accounts', this.log.child({
				module: "mongo"
			}));
		});

		var enToken = function (uname, password, someinfo) {
			var str = encodeURIComponent(uname) + " " + encodeURIComponent(password) + " " + encodeURIComponent(someinfo);
			//console.log(str);
			return str;
		};

		var deToken = function (token, callback) {
			var componenets = token.split(' ');
			if (!componenets || componenets.length !== 3)
				return callback(new restify.RestError({
					statusCode: 401,
					message: 'Required authentication header missing'
				}));
			return callback(null,
				decodeURIComponent(componenets[0]),
				decodeURIComponent(componenets[1]),
				decodeURIComponent(componenets[2])
			);
		};

		server.post('/sessions', restify.bodyParser({mapParams: false}), function (req, res, next) {
			//The body parser above should convert the form data parameters into json object
			if (!req.body || !req.body.uname || !req.body.pass) {
				return next(new restify.HttpError({statusCode: 400}));
			}
			var am = new AccountManager(function (err) {
				if (err) return next(new restify.InternalError());
				am.login(function (err, id) {
					if (err) {
						if (err instanceof AM.IncorrectCredentials) {
							return next(new restify.ConflictError('Username or password incorrect'));
						}
						return next(new restify.InternalError());
					}
					var ret = {sessionID: enToken(req.body.uname, req.body.pass, id)};
					res.send(201, ret);
					return next();
				}, req.body.uname, req.body.pass);
			}, This.config.mongo, 'accounts', this.log.child({
				module: "mongo"
			}));
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
			deToken(token, function (err, uname, pass, tokenID) {
				if (err) return next(err);
				var am = new AccountManager(function (err) {
					if (err) return next(new restify.InternalError());
					am.login(function (err, id) {
						if (err || id !== tokenID)
							return next(new restify.InternalError());
						req.context.user = {
							uname: uname,
							pass: pass,
							id: id,
							accountManager: am,
							session: token,
							sessions: [token]
						};
						return next();
					}, uname, pass);
				}, This.config.mongo, 'accounts', This.log.child({
					module: 'mongo'
				}));
			});

		});

		//Kill unauthorized
		server.use(function (req, res, next) {
			if (!req.context.user) {
				return next(new restify.NotAuthorizedError());
			}
			next();
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
		server.head('/sessions/:sessionID', function (req, res, next) {
			res.send(200);
			return next();
		});
		server.get('/sessions/:sessionID', function (req, res, next) {
			res.send({sessionID: req.context.user.session});
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
