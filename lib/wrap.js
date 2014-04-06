var Pimp = require('./pimp');

Pimp.resolved = function(value) {
    return new Pimp(function(ff) {
        ff(value);
    });
};

Pimp.rejected = function(reason) {
    return new Pimp(function(f, r) {
        r(reason);
    });
};

module.exports = Pimp;