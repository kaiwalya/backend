

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