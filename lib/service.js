"use strict";


/////////////////
//Configuration//
/////////////////

var config = require('../lib/config.js').loadConfig('api');

var Logger =  require('bunyan');

var log = new Logger({name: "Webservice", streams: [{path: __dirname + "/../../logs/service.log"}]});
log.level(Logger.DEBUG);
log.debug('Logging Initialized');

var pacakgeConfig = require('../package.json');
log.info("Package version is: %s", JSON.stringify(pacakgeConfig.version, null, 2));

var restify = require('restify');

var server = restify.createServer({log: log});
server.use(restify.gzipResponse());

server.get('/version', function (req, res) {
	res.send(pacakgeConfig.version);
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	log.info('version ' + pacakgeConfig.version + ' was requested from ipAddress ' + ip);
});

server.listen(config.port, function () {
	log.info('%s listening at %s', server.name, server.url);
});

exports.config = config;

