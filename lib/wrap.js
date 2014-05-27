(function(global) {
  "use strict";

  var Pimp;
  
  //if browser
  if (global.toString() === "[object Window]" && typeof require === "undefined") {
    Pimp = global.Pimp;
  }
  //if NOT running tests on generated browser code 
  //this is just to move the more used case higher in the if block
  else if (!process.env.PIMP_BROWSER_TEST) {
    Pimp = require("./pimp");
  }
  //if running tests on code generated for the browser (inclusive of setImmediate shim)
  else {
    Pimp = global.exports;
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

  Pimp.prototype.
  catch = function(fn) {
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
