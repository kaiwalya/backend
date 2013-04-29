var fs = require('fs');

exports.installRoutes = function (ctx, callback) {
	fs.readFile(__dirname + '/../../package.json', function (err, data) {
		if (err) {
			ctx.log.fatal("Coulnt read package.json");
			return callback(err);
		}
		var pacakgeConfig = JSON.parse(data.toString());
		ctx.log.info("Package version is: " + JSON.stringify(pacakgeConfig.version, null, 2));

		////////////////////////////
		//Everyone
		////////////////////////////
		ctx.server.get('/version', function (req, res, next) {
			res.send(pacakgeConfig.version);
			return next();
		});
		callback();
	});
};
