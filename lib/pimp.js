(function(global) {
  'use strict';

  if (global.exports) {
    global.exports = Promise;
  }
  //if browser
  else {
    global.Pimp = Promise;
  }

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
  //add the subtle bits as outlined by Domenic at the link below
  //https://gist.github.com/thanpolas/5758331
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
      var deferredObj;
      var prom = new Promise(function(rs, rj) {
        deferredObj = {
          promise: prom,
          onFulfilled: "function" === typeof onFF && onFF,
          onRejected: "function" === typeof onRej && onRej,
          resolve: rs,
          reject: rj,
          done: false
        };
      });

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
      if (val) {
        if (self === val) {
          reject(new TypeError("Promise cannot resolve to itself. Sorry brah!"));
        }
        else if (val.constructor && val.constructor.name === "Promise") {
          val.then(resolve, reject);
        }
        else if ("function" === typeof val || "object" === typeof val) {
          try {
            var then = val.then;

            if ("function" === typeof then) {
              resolveThenable(then.bind(val), resolve, reject);
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
        else {
          state = true;
          value = val;
        }
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

    function resolveThenable(fn, onFF, onRej) {
      var flag = false;
      try {
        fn(function(y) {
          if (!flag) {
            flag = true;
            onFF(y);
          }
        }, function(r) {
          if (!flag) {
            flag = true;
            onRej(r);
          }
        });
      }
      catch (e) {
        if (!flag) {
          flag = true;
          onRej(e);
        }
      }
    }

  }
})(typeof module === "undefined" ? window : module);
