'use strict';

module.exports = Promise;

var callAsap;

try {
    //if node
    if (process && process.nextTick) {
        callAsap = process.nextTick;
    }
    else if (setImmediate) {
        callAsap = setImmediate;
    }
}
catch (e) {
    //browser
    callAsap = function(cb) {
        window.setTimeout(function() {
            cb();
        }, 0);
    };
}

function Promise(fn) {
    var state = null; // pending = null, fulfilled = true, rejected = false
    var deferreds = [];
    var value;
    var self = this;

    if ("function" !== typeof fn) {
        return new TypeError("Promise constructor requires a function");
    }
    else {
        try {
            fn(resolve, reject);
        }
        catch (e) {
            reject(e);
        }
    }

    this.then = function(onFF, onRej) {
        var res;
        var rej;
        var prom = new Promise(function(rs, rj) {
            res = rs;
            rej = rj;
        });
        var deferredObj = {
            promise: prom,
            onFulfilled: "function" === typeof onFF && onFF,
            onRejected: "function" === typeof onRej && onRej,
            resolve: res,
            reject: rej,
            done: false
        };

        handleDeferred(deferredObj);

        deferreds.push(deferredObj);

        return prom;
    };

    function handleDeferred(deferred) {
        var cb;
        if (state === null) {
            return;
        }
        else if (!deferred.done) {
            cb = state ? deferred.onFulfilled : deferred.onRejected;
            if (cb) {
                callAsap(function() {
                    var ret;
                    try {
                        ret = cb(value);
                        deferred.resolve(ret);
                    }
                    catch (e) {
                        deferred.reject(e);
                    }

                });
            }
            else {
                state ? deferred.resolve(value) : deferred.reject(value);
            }

            deferred.done = true;
        }
    }

    function callDeferreds() {
        for (var i in deferreds) {
            handleDeferred(deferreds[i]);
        }
    }

    function resolve(val) {
        if (state !== null) {
            return;
        }
        if (self === val) {
            reject(new TypeError("Promise cannot resolve to itself. Sorry brah!"));
        }
        else if (val && val.constructor && val.constructor.name === "Promise") {
            val.then(resolve, reject);
        }
        else if (("function" === typeof val || "object" === typeof val) && val !== null) {
            try {
                var then = val.then;

                if ("function" === typeof then) {
                    try {
                        then.call(val, function(y) {
                            resolve(y);
                        }, function(r) {
                            reject(r);
                        });
                    }
                    catch (e) {
                        reject(e);
                    }

                }
                else {
                    state = true;
                    value = val;
                }
            }
            catch (e) {
                reject(e);
            }
        }
        else if (("function" !== typeof val && "object" !== typeof val) && val !== null) {
            state = true;
            value = val;
        }
        else {
            state = true;
            value = val;
        }
        callDeferreds();
    }

    function reject(reason) {
        if (state !== null) {
            return;
        }
        state = false;
        value = reason;
        callDeferreds();
    }

}

Promise.resolved = function(value) {
    return new Promise(function(ff) {
        ff(value);
    });
};

Promise.rejected = function(reason) {
    return new Promise(function(f, r) {
        r(reason);
    });
};
