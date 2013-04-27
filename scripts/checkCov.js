"use strict";

var covFile = process.argv[2];
var cov;
if (covFile[0] === "/") {
	cov = require(covFile);
}
else {
	cov = require(process.cwd() + "/" + covFile);
}

var makeCovStr = function (f) {
	var str = (Math.floor((f * 1000) + 0.5) / 1000).toString() + '%';
	return str;
};


var covLimit = 90;
var errCode = 0;
var makeLimitErrString = function (f) {
	if (f < covLimit) {
		errCode = -1;
		return "<---- Error, Limit: " + makeCovStr(covLimit);
	}
	return "";
};

console.log('');
console.log('--------------------------');
console.log('Total Coverage:\t', makeCovStr(cov.coverage), makeLimitErrString(cov.coverage));
console.log('--------------------------');
for (var iF in cov.files) {
	var f = cov.files[iF];
	console.log(f.filename + ":\t", makeCovStr(f.coverage), makeLimitErrString(f.coverage));
}

console.log('');
process.exit(errCode);
