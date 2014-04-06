var Pimp = require('./pimp');

Pimp.resolve = function(value) {
    return new Pimp(function(ff) {
        ff(value);
    });
};

Pimp.reject = function(reason) {
    return new Pimp(function(f, r) {
        r(reason);
    });
};

Pimp.cast = function(value) {

};

Pimp.all = function(promiseList) {

};

Pimp.race = function(promiseList) {

};

module.exports = Pimp;
