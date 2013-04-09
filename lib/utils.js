var child_process = require('child_process');
var events = require('events');
var util = require('util');

exports.generateUUID = function () {
	var ret = "";
	var i = 0;
	while (i < 4) {
		var r = Math.floor(Math.random() * 255 + 0.5);
		r = r.toString(16);
		ret = ret + r;
		i = i + 1;
	}
	return ret.toUpperCase();
};

function QuickProcess(executable, params) {
	this.executable = executable;
	this.params = params;
}
exports.QuickProcess = QuickProcess;

QuickProcess.prototype.launch = function (callback) {
	this.cp = child_process.spawn(this.executable, this.params);
	this.cp.stdout.on('data', function (chunk) {
		if (this.buffer)
			this.buffer = Buffer.concat([this.buffer, chunk]);
		else
			this.buffer = chunk;
	}.bind(this));

	this.cp.stdout.on('error', function () {
		return callback(new Error("Cannot read output"));
	});
/*
	this.cp.stdout.on('end', function (chunk) {
		if (!this.buffer) {
			return callback(new Error("MongoDb Not found"));
		}
		console.log(buffer.toString());
	});
*/
	this.cp.on('close', function (code, signal) {
		if (code || signal) {
			return callback(new Error("Error finding mongod"));
		}
		else {
			callback(null, this.buffer);
		}
	}.bind(this));
};

function Processor(source, tf) {
	events.EventEmitter.call(this);
	this.source = source;
	this.onData = function (chunk) {
		this.emit('data', chunk);
	}.bind(this);

	this.source.on('data', function (chunk) {
		tf(chunk, this.onData);
	}.bind(this));

	this.source.on('end', function () {
		this.emit('end');
	}.bind(this));
}

util.inherits(Processor, events.EventEmitter);
exports.Processor = Processor;

function StringEncoder(source) {
	Processor.call(this, source, function (chunk, next) {
		if (chunk)
			return next(chunk.toString());
		return next();
	}.bind(this));
}

util.inherits(StringEncoder, Processor);
exports.StringEncoder = StringEncoder;

function LineBreaker(source) {
	this.lastString = null;
	Processor.call(this, source, function (chunk, next) {
		if (this.lastString) {
			this.lastString = this.lastString + chunk;
		}
		else {
			this.lastString = chunk;
		}
		//console.log("[" + this.lastString + "]");
		var iLeft = 0;
		var iEnd = this.lastString.indexOf('\n');
		while (iEnd >= 0) {
			next(this.lastString.substring(iLeft, iEnd));
			iLeft = iEnd + 1;
			iEnd = this.lastString.indexOf('\n', iLeft);
			//console.log(iLeft, iEnd, this.lastString.length);
		}
		if (iLeft === this.lastString.length) {
			this.lastString = null;
		}
		else {
			//console.log(this.lastString);
			this.lastString = "FIXME";
		}
	}.bind(this));
}

util.inherits(LineBreaker, Processor);
exports.LineBreaker = LineBreaker;
