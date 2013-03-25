'use strict';

function Configuration() {
	this.apiHost = '0.0.0.0';
	this.apiPort = 8474;
	this.webHost = '0.0.0.0';
	this.webPort = 8475;
}

Configuration.prototype.getAPIEndPoint = function(){
	return "http://" + this.apiHost + ":" + this.apiPort;
};


Configuration.prototype.getWebEndPoint = function(){
	return "http://" + this.webHost + ":" + this.webPort;
};

Configuration.prototype.getAPIHost = function(){
	return this.apiHost;
};

Configuration.prototype.getAPIPort = function(){
	return this.apiPort;
};


Configuration.prototype.getWebHost = function(){
	return this.webHost;
};

Configuration.prototype.getWebPort = function(){
	return this.webPort;
};


exports.Configuration = Configuration;
