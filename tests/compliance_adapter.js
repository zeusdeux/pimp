var Prom = require('../lib/core');

exports.resolved = function(value) {
	var prom = new Prom();
	prom.resolve(value);
	return prom;
};

exports.rejected = function(reason) {
	var prom = new Prom(function(f, r) {
		r(reason);
	});
	setTimeout(function() {
		return prom;
	}, 0);
};

exports.deferred = function() {
	var prom = new Prom();

	return {
		promise: prom,
		resolve: function(value) {
			return prom.resolve(value);
		},
		reject: function(reason) {
			return prom.resolve(Prom.reject(reason));
		}
	};

};