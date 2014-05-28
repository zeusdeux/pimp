//setImmediate shim by YuzuJS 
//https://github.com/YuzuJS/setImmediate
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
        tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
        return nextHandle++;
    }

    // This function accepts the same arguments as setImmediate, but
    // returns a function that requires no arguments.
    function partiallyApplied(handler) {
        var args = [].slice.call(arguments, 1);
        return function() {
            if (typeof handler === "function") {
                handler.apply(undefined, args);
            } else {
                (new Function("" + handler))();
            }
        };
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    task();
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function installNextTickImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            process.nextTick(partiallyApplied(runIfPresent, handle));
            return handle;
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            global.postMessage(messagePrefix + handle, "*");
            return handle;
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            channel.port2.postMessage(handle);
            return handle;
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
            return handle;
        };
    }

    function installSetTimeoutImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
            return handle;
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(new Function("return this")()));
//Pimp core: 
(function(global) {
  "use strict";

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
    callAsap = process.nextTick;
  }
  catch (e) {

    try {
      callAsap = setImmediate;
    }
    catch (e) {
      //browser
      callAsap = function(cb) {
        window.setTimeout(function() {
          cb();
        }, 0);
      };
    }
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
          (state ? deferred.resolve : deferred.reject)(value);
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
          reject(new TypeError("Promise cannot resolve to itself"));
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

  function validateCall(check, methodName, param) {
    var validations = {
      isArray: function(){
        if (!(param instanceof Array)) {
          throw new SyntaxError(methodName + " needs to be passed an array");
        }
        if (!param.length) {
          throw new SyntaxError(methodName + " needs an array of length >= 1");
        }
      },
      isFunc: function(){
        if (!(param instanceof Function)) {
          throw new SyntaxError(methodName + " needs to be passed a function to promisify");
        }
      }
    };
    validations[check]();
    return true;
  }

  Pimp.prototype.catch = function(fn) {
    return this.then(function(v) {
      return v;
    }, fn);
  };

  //behaves like Q's promise.finally
  //https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback
  Pimp.prototype.finally = function(fn){
    var self = this;
    var wrapFn = function(v){
      var retVal = 0;
      var tempFn = function(){
        return self;
      };
      if (typeof fn === "function") retVal = fn(v);
      return Pimp.cast(retVal).then(tempFn, tempFn);
    };
    return this.then(wrapFn,wrapFn);
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
    validateCall("isArray", "Pimp.all", promiseList);
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
    validateCall("isArray","Pimp.allFail", promiseList);
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
    validateCall("isArray","Pimp.race", promiseList);
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
    validateCall("isFunc","Pimp.denodeify", fn);
    return function() {
      var deferred = Pimp.deferred();
      var cb = function(err, res) {
        if (err) {
          deferred.reject(err);
        }
        else {
          res = arguments.length > 2 ? [].slice.call(arguments, 1) : res;
          deferred.resolve(res);
        }
      };
      [].push.call(arguments, cb);
      fn.apply(this, arguments);
      return deferred.promise;
    };
  };

})(typeof module === "undefined" ? window : module);
