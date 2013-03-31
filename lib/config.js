'use strict';

var externalServiceConfigs = {
	api: {
		secure: false,
		hostName: '0.0.0.0',
		port: 8474
	},
	site: {
		secure: false,
		hostName: '0.0.0.0',
		port: 8475
	}
};

var makeURL = function (cfg) {
	var schema;
	if (cfg.secure) {
		schema = "https";
	}
	else {
		schema = "http";
	}

	return schema + "://" + cfg.hostName + ":" + cfg.port;
};

var internalConfig = {
	api: {
		secure: false,
		hostName: '0.0.0.0',
		port: 8474,
		external: externalServiceConfigs,
		getEndpoint: function () { return makeURL(this); }
	},
	site: {
		secure: false,
		hostName: '0.0.0.0',
		port: 8475,
		external: externalServiceConfigs,
		getEndpoint: function () { return makeURL(this); }
	}
};

function loadConfig(who) {
	if (who === 'api') {
		return internalConfig.api;
	}
	else if (who === 'site') {
		return internalConfig.site;
	}
	else {
		throw new Error('Unknown config client ' + who);
	}
}

exports.loadConfig = loadConfig;
