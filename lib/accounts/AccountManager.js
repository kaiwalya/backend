var mongoose = require('mongoose');
var crypto = require('crypto');

var libRoot = '..';
var utils = require(libRoot + '/utils');

var accountSchema = {
	_id: String,
	name: String,
	hash: String,
};

//This should be initialzed into the account Model which will be used as a class.
var AccountModel;

exports.UserExists = function () {
	Error.call(this, 'User already exists');
};
exports.UserExists.prototype = Object.create(Error.prototype);
var UserExists = exports.UserExists;

exports.IncorrectCredentials = function () {
	Error.call(this, 'Incorrect Credentials');
};
exports.IncorrectCredentials.prototype = Object.create(Error.prototype);

var IncorrectCredentials = exports.IncorrectCredentials;



exports.AccountManager = function (done, strMongoServerURL, strDBName, log) {
	var This = this;
	this.mongoURL = strMongoServerURL;
	this.dbName = strDBName;
	this.log = log;
	var connectionString = strMongoServerURL + "/" + strDBName;

	log.info('AccountManager Trying to connect to ' + connectionString);
	this.db = mongoose.createConnection(connectionString);
	var pendingInit = true;
	this.db.on('error', function (err) {
		This.log.fatal('Receviced error form mongoose: ' + JSON.stringify(err));
		if (pendingInit) return done(err);
		throw new Error(err);
	});
	this.db.once('open', function () {
		This.log.info('Connection succeeded');
		This.schema = mongoose.Schema(accountSchema);
		AccountModel = This.db.model('Account', This.schema);
		pendingInit = false;
		done();
	});
};

var encodeIntoSaltedHash = function (password) {
	return crypto.createHash('sha1').update(password).digest('hex');
};


var confirmSaltedHash = function (hash, password) {
	return encodeIntoSaltedHash(password) === hash;
};

exports.AccountManager.prototype.login = function (callback, uname, password) {
	var This = this;
	AccountModel.findOne({
			name: uname
		},
		function (err, account) {
			if (err) return callback(err);
			if (!account) return callback(new IncorrectCredentials(), null);
			if (confirmSaltedHash(account.hash, password)) {
				This.log.info('Account %s logged in', account._id);
				return callback(null, account._id);
			}
			return callback(new IncorrectCredentials(), null);
		}
	);
};

exports.AccountManager.prototype.createAccount = function (callback, uname, password) {
	var acc = new AccountModel();
	acc._id = utils.generateUUID();
	acc.name = uname;
	acc.hash = crypto.createHash('sha1').update(password).digest('hex');
	var This = this;
	AccountModel.findOne({
			name: acc.name
		},
		function (err, account) {
			if (err) return callback(err);
			if (account) return callback(new UserExists(), null);
			acc.save(function (err) {
				if (err) return callback(err);
				This.log.info('Account %s created', acc._id);
				return callback(null, acc._id);
			});
		}
	);
};

exports.AccountManager.prototype.deleteAccount = function (callback, uname, password) {
	this.login(function (err, id) {
		AccountModel.findByIdAndRemove(id, function (err) {
			if (err) callback(err);
			callback();
		});
	}, uname, password);
};


