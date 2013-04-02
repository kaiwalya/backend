"use strict";


/////////////////
//Configuration//
/////////////////

var config = require('../lib/config.js').loadConfig('api');
var log = config.log;

var pacakgeConfig = require('../package.json');
log.info("Package version is: %s", JSON.stringify(pacakgeConfig.version, null, 2));

var restify = require('restify');

var serverOpt = {
	name: config.name,
	key: config.key,
	certificate: config.certificate,
	ca: config.certifyingAuthorities,
	log: log
};

var server = restify.createServer(serverOpt);
server.use(restify.gzipResponse());

server.get('/version', function (req, res) {
	res.send(pacakgeConfig.version);
	var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
	log.info('version ' + pacakgeConfig.version + ' was requested from ipAddress ' + ip);
});

server.listen(config.port, function () {
	log.info("Ready: " + config.uri);
});

exports.config = config;

