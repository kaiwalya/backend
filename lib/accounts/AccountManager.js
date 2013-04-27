var mongoose = require('mongoose');
var crypto = require('crypto');

var libRoot = '..';
var utils = require(libRoot + '/utils');

var accountSchema = {
	_id: String,
	name: String,
	hash: String,
};

var sessionSchema = {
	_id: String,
	accountID: String,
	isActive: Boolean
};


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

exports.MongooseConnection = function (done, strMongoServerURL, strDBName, log) {
	var This = this;
	this.mongoURL = strMongoServerURL;
	this.dbName = strDBName;
	this.log = log;
	var connectionString = strMongoServerURL + "/" + strDBName;

	log.debug('AccountManager Trying to connect to ' + connectionString);
	this.db = mongoose.createConnection(connectionString);
	var pendingInit = true;
	this.db.on('error', function (err) {
		This.log.fatal('Receviced error form mongoose: ' + JSON.stringify(err));
		if (pendingInit) return done(err);
		throw new Error(err);
	});
	this.db.once('open', function () {
		This.log.debug('Connection succeeded');
		//This should be initialzed into the account Model which will be used as a class.
		This.AccountModel = This.db.model('Account', mongoose.Schema(accountSchema));
		//Similarly for Sessions
		This.SessionModel = This.db.model('Sessions', mongoose.Schema(sessionSchema));
		pendingInit = false;
		setTimeout(function () {done(null, This); });
	});
};

exports.AccountManager = function (done, mongoConnection, log) {
	var This = this;
	this.log = log;
	this.conn = mongoConnection;
	this.AccountModel = this.conn.AccountModel;
	this.SessionModel = this.conn.SessionModel;
	setTimeout(function () {done(null, This); });
};

var encodeIntoSaltedHash = function (password) {
	return crypto.createHash('sha1').update(password).digest('hex');
};


var confirmSaltedHash = function (hash, password) {
	return encodeIntoSaltedHash(password) === hash;
};

exports.AccountManager.prototype.login = function (callback, uname, password) {
	var This = this;
	This.AccountModel.findOne({
			name: uname
		},
		function (err, account) {
			if (err) return callback(err);
			if (!account) return callback(new IncorrectCredentials(), null);
			if (!confirmSaltedHash(account.hash, password)) {
				return callback(new IncorrectCredentials(), null);
			}
			var session = new This.SessionModel();
			session._id = utils.generateUUID();
			session.accountID = account._id;
			session.isActive = true;
			session.save(function (err) {
				if (err) return callback(err);
				This.log.info('Account %s logged in with session %s', account._id, session._id);
				return callback(null, session._id);
			});
		}
	);
};

exports.AccountManager.prototype.findSession = function (callback, sid) {
	var This = this;
	This.SessionModel.findOne({_id: sid, isActive: true}, {accountID: 1}, function (err, obj) {
		if (err) return callback(err);
		if (!obj) return callback(new IncorrectCredentials());
		//if callback is only expecting an error, we are done
		if (callback.length === 1) return callback();
		//else we need to find all active sessions for the current user
		This.SessionModel.find({accountID: obj.accountID, isActive: true}, {_id: 1}, function (err, objs) {
			if (err) return callback(err);
			var ret = [];
			objs.forEach(function (session) {
				ret.push(session._id);
			});
			callback(null, ret);
		});
	});
};

exports.AccountManager.prototype.logout = function (callback, sid) {
	var This = this;
	This.SessionModel.findOne({_id: sid}, {isActive: 1}, function (err, obj) {
		if (err) {
			This.log.info(new Error(err));
			return callback(err);
		}
		if (!obj) return callback(new IncorrectCredentials());
		if (!obj.isActive) callback();
		obj.isActive = false;
		obj.save(function (err) {
			if (err) {
				This.log.info(new Error(err));
				return callback(err);
			}
			return callback();
		});
	});
};

exports.AccountManager.prototype.createAccount = function (callback, uname, password) {
	var This = this;
	var acc = new This.AccountModel();
	acc._id = utils.generateUUID();
	acc.name = uname;
	acc.hash = crypto.createHash('sha1').update(password).digest('hex');
	This.AccountModel.findOne({
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
	var This = this;
	This.login(function (err, id) {
		This.AccountModel.findByIdAndRemove(id, function (err) {
			if (err) callback(err);
			callback();
		});
	}, uname, password);
};

