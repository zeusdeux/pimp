var Prom = require('../lib/wrap');

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
