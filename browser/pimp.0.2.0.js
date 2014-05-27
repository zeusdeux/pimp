//Pimp core: 
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

  //todo:
  //think about adding the subtle bits as outlined by Domenic at the link below
  //https://gist.github.com/thanpolas/5758331
  //not entirely convinced with it since it may cause handleDeferreds to be 
  //async sometimes and sync other times
  //but it can help speed things up by not deferring execution to the next
  //run of the event loop when not needed

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

    this.inspect = function() {
      var result = {};
      if (state === null) {
        result.state = "pending";
      }
      else if (state) {
        result.state = "fulfilled";
        result.value = value;
      }
      else {
        result.state = "rejected";
        result.reason = value;
      }
      return result;
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

//Pimp wrap: 
(function(global) {
  'use strict';

  var Pimp;
  if (global.toString() === "[object Window]" && typeof require === "undefined") {
    Pimp = global.Pimp;
  }
  else {
    Pimp = require("./pimp");
  }

  if (global.exports) {
    global.exports = Pimp;
  }
  //if browser
  else {
    global.Pimp = Pimp;
  }

  function validateCall(methodName, param) {
    switch (methodName) {
      case "Pimp.all":
      case "Pimp.allFail":
      case "Pimp.race":
        if (!(param instanceof Array)) {
          throw new SyntaxError(methodName + " needs to be passed an array");
        }
        if (!param.length) {
          throw new SyntaxError(methodName + " needs an array of length >= 1");
        }
        break;
      case "Pimp.denodeify":
        if (!(param instanceof Function)) {
          throw new SyntaxError(methodName + " needs to be passed a function to promisify");
        }
        break;
      default:
        break;
    }
    return true;
  }

  Pimp.prototype.catch = function(fn) {
    return this.then(function(v) {
      return v;
    }, fn);
  };

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
    if (value instanceof Pimp && value.then) {
      return value;
    }
    else {
      return Pimp.resolve(value);
    }
  };

  Pimp.all = function(promiseList) {
    validateCall("Pimp.all", promiseList);
    return new Pimp(function(f, rej) {
      var count = 0;
      var resArray = [];
      for (var i in promiseList) {
        if (promiseList.hasOwnProperty(i)) {
          if (!promiseList[i].then) promiseList[i] = Pimp.cast(promiseList[i]);
          promiseList[i].then(function(v) {
            count++;
            resArray.push(v);
            if (promiseList.length === count) f(resArray);
          }, function(r) {
            rej(r);
          });
        }
      }
    });
  };

  //when all promises in promiseList reject, promise returned by Pimp.allFail resolves
  //with an array of reasons of all rejected promises in promiseList as its value
  //if any promise in the promiseList resolves then the promise returned by allFail
  //rejects with the value of the promise that resolved and ignores all the other
  //promises in the promiseList
  Pimp.allFail = function(promiseList) {
    validateCall("Pimp.allFail", promiseList);
    return new Pimp(function(f, rej) {
      var count = 0;
      var resArray = [];
      for (var i in promiseList) {
        if (promiseList.hasOwnProperty(i)) {
          if (!promiseList[i].then) promiseList[i] = Pimp.cast(promiseList[i]);
          promiseList[i].then(function(v) {
            rej(v);
          }, function(r) {
            count++;
            resArray.push(r);
            if (promiseList.length === count) f(resArray);
          });
        }
      }
    });
  };

  //Returns a promise that either resolves when the first promise in 
  //the iterable resolves, or rejects when the first promise in the iterable rejects.
  Pimp.race = function(promiseList) {
    validateCall("Pimp.race", promiseList);
    return new Pimp(function(f, rej) {
      for (var i in promiseList) {
        if (promiseList.hasOwnProperty(i)) {
          if (!promiseList[i].then) promiseList[i] = Pimp.cast(promiseList[i]);
          promiseList[i].then(function(v) {
            f(v);
          }, function(r) {
            rej(r);
          });
        }
      }
    });
  };

  Pimp.deferred = function() {
    var deferredObj = {};
    deferredObj.promise = new Pimp(function(res, rej) {
      deferredObj.resolve = res;
      deferredObj.reject = rej;
    });
    deferredObj.inspect = deferredObj.promise.inspect;
    return deferredObj;
  };

  Pimp.denodeify = function(fn) {
    validateCall("Pimp.denodeify", fn);
    return function() {
      var deferred = Pimp.deferred();
      var cb = function(err, res) {
        if (err) {
          deferred.reject(err);
        }
        else {
          deferred.resolve(res);
        }
      };
      [].push.call(arguments, cb);
      fn.apply(this, arguments);
      return deferred.promise;
    };
  };

})(typeof module === "undefined" ? window : module);
