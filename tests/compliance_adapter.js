var Prom = require('../lib/core');

exports.deferred = function() {
	var res, rej;
	var prom = new Prom(function(ff, rj) {
		res = ff;
		rej = rj;
	});

	return {
		promise: prom,
		resolve: res,
		reject: rej
	};

};

exports.resolved = Prom.resolve;
exports.rejected = Prom.reject;