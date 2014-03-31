(function(global) {
	'use strict';

	//http://promises-aplus.github.io/promises-spec/
	//https://github.com/promises-aplus/promises-tests
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

	//if node
	if (global.exports) {
		global.exports = Promise;
	}
	//if browser
	else {
		global.Prom = Promise;
	}

	//2.1 promise states
	var States = {
		pending: 2,
		fulfilled: 1,
		rejected: -1
	};

	//Make States immutable
	if (Object.freeze) {
		Object.freeze(States);
	}

	//Promise constructor
	function Promise(fn) {

		var state = States.pending;
		var valueOrReason;
		var callAsap;
		//Holds the handlers and promises of all the then calls on the current promise instance
		var thenCache = [];
		//self
		var self = this;

		//2.2.4 onFulfilled or onRejected must not be called until the execution context stack contains only platform code
		//setup a callAsap method to call asap on next tick or next iteration of event loop
		//this makes sure that the execution context contains only platform code
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
				window.setTimeout(cb, 0);
			};
			//this should actually be something like:
			// callAsap = function(cb) {
			// 	var args = arguments;
			// 	window.setTimeout(function(){
			// 		cb.apply(self/*figure out what the this val should be*/, [].shift.call(args));
			// 	}, 0);
			// };
		}

		//mozilla calls fulfill as resolve
		if (fn && typeof fn === "function") {
			fn(fulfill, reject);
		}

		//same as if above
		//try {
		//	(typeof fn === "function" && fn)();
		//}
		//catch(e){
		//}

		//Privileged functions

		this.then = function(onFulfilled, onRejected) {
			var thenPromise = new Promise();

			//store the handlers and the promise returned
			thenCache.push({
				promise: thenPromise,
				//when onFulfilled === "function" && onFulfilled evaluates to true 
				//it actually evaluates to onFulfilled 
				//which is final truthy value (hence it seems like its evaluated to true). 
				//When it evaluates to a falsy value it returns the falsy value which 
				//is "false" in this case from the === check

				//2.2.1 Both onFulfilled and onRejected are optional arguments:
				//2.2.1.1 If onFulfilled is not a function, it must be ignored.
				//2.2.1.2 If onRejected is not a function, it must be ignored.
				onFulfilled: typeof onFulfilled === "function" && onFulfilled,
				onRejected: typeof onRejected === "function" && onRejected
			});

			//2.2.7 then must return a promise 
			return thenPromise;
		};

		//figure out a way to make sure that the call to resolve is from within the library
		//and not by a naughty user and/or some other piece of non-library code
		this.resolve = function(returnVal) {
			//2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
			//var self = this;
			if (self === returnVal) {
				throw new TypeError("Promise cannot resolve to itself. Sorry brah!");
			}
			//2.3.2 If x is a promise, adopt its state
			else if (returnVal && returnVal.constructor && returnVal.constructor.name === "Promise") {
				
				//add current promise as dependant on the promise it is resolving to as a read only prop
				if (!returnVal.leftDependantProm) {
					Object.defineProperty(returnVal, "leftDependantProm", {
						enumerable: true,
						value: self
					});
				}

				//promise should adopt state of returnVal as value is a promise
				if (returnVal.state() === States.fulfilled) {
					fulfill(returnVal.value());
				}
				else if (returnVal.state() === States.rejected) {
					reject(returnVal.value());
				}
			}
			//2.3.3 Otherwise, if x is an object or function,
			else if (typeof returnVal === "object" || typeof returnVal === "function") {
				try {
					//2.3.3.1 Let then be x.then
					var then = returnVal.then;

					//2.3.3.3 If then is a function, call it with x as this, first argument 
					//resolvePromise, and second argument rejectPromise, where:
					if (typeof then === "function") {
						try {
							then.call(returnVal, function(y) {
								self.resolve(y);
							}, function(r) {
								reject(r);
							});
						}
						catch (e) {
							if (returnVal.state() === States.pending){
								reject(e);
							}
						}
					}
					//2.3.3.4 If then is not a function, fulfill promise with x.
					else {
						fulfill(returnVal);
					}
				}
				catch (e) {
					//2.3.3.2 If retrieving the property x.then results in a thrown exception e, 
					//reject promise with e as the reason.
					reject(e);
				}

			}
			else {
				//2.3.4 If x is not an object or function, fulfill promise with x.
				fulfill(returnVal);
			}
		};

		this.state = function() {
			return state;
		};

		this.value = function() {
			return valueOrReason;
		};


		//Private functions

		//maybe fulfill and reject can be merged into one function since they
		//do the same stuff on diff methods thats all

		function fulfill(value) {
			//2.2.2 If onFulfilled is a function: 
			//2.2.2.3 it must not be called more than once.
			changeState("fulfilled");
			//2.1.2		When fulfilled, a promise:
			//2.1.2.2	must have a value, which must not change.
			valueOrReason = value;

			//2.2.2 If onFulfilled is a function: 
			//2.2.2.1 it must be called after promise is fulfilled, with promise’ s value as its first argument.
			//2.2.2.2 it must not be called before promise is fulfilled.
			for (var i in thenCache) {
				var cacheElement = thenCache[i];
				try {
					if (cacheElement["onFulfilled"]) {
						//shit call to setTimeout as it accepts 1st param as a function. fix this as
						//its causing our function to execute before nextTick of event loop
						callAsap(cacheElement["promise"].resolve(cacheElement["onFulfilled"](valueOrReason)));
					}
					else {
						//if onFulfilled is not a function then resolve (fulfill it while resolving)
						//promise with value from parent promise in chain
						callAsap(cacheElement["promise"].resolve(valueOrReason));
					}
				}
				catch (e) {
					//resolve with error (reject it with 'e' as reason while resolving)
					callAsap(cacheElement["promise"].resolve(e));
				}
			}


			//resolve the promise that depends on the resolution of current promise
			//For point 2.3.2
			if (self.leftDependantProm) {
				self.leftDependantProm.resolve(self);
			}
		}

		function reject(reason) {
			//2.2.3 If onRejected is a function,
			//2.2.3.3 it must not be called more than once.
			changeState("rejected");
			//2.1.3		When rejected, a promise:
			//2.1.3.2	must have a reason, which must not change.
			valueOrReason = reason;

			//2.2.3 If onRejected is a function,
			//2.2.3.1 it must be called after promise is rejected, with promise’ s reason as its first argument.
			//2.2.3.2 it must not be called before promise is rejected.
			for (var i in thenCache) {
				var cacheElement = thenCache[i];
				try {
					if (cacheElement["onRejected"]) {
						callAsap(cacheElement["promise"].resolve(cacheElement["onRejected"](valueOrReason)));
					}
					else {
						//if onRejected is not a function then resolve (reject it while resolving)
						//promise with reason from parent promise in chain
						callAsap(cacheElement["promise"].resolve(valueOrReason));
					}
				}
				catch (e) {
					//resolve with error (reject it with 'e' as reason while resolving)
					callAsap(cacheElement["promise"].resolve(e));
				}
			}

			//resolve the promise that depends on the resolution of current promise
			//For point 2.3.2
			if (self.leftDependantProm) {
				self.leftDependantProm.resolve(self);
			}
		}

		function changeState(newState) {
			var newStateVal = States[newState];
			//The new state should be either pending, fulfilled or rejected
			if (!newStateVal) {
				throw new TypeError("State has to be fulfilled, rejected or pending.");
			}
			//2.1.1		When pending, a promise:
			//2.1.1.1	may transition to either the fulfilled or rejected state.
			if (state === States.pending) {

				if (newStateVal === States.pending) {
					return;
				}
				else {
					state = newStateVal;
				}
			}
			else {
				//2.1.2		When fulfilled, a promise: 
				//2.1.2.1	must not transition to any other state.
				//2.1.3		When rejected, a promise: 
				//2.1.3.1	must not transition to any other state.
				throw new TypeError("State cannot be changed once fulfilled or rejected.");
			}

		}

		function adoptState(newState, value) {
			try {
				changeState(newState);
				valueOrReason = value;
			}
			catch (e) {
				throw e;
			}
		}


	}

	Promise.deferred = function() {

	};

	//mozilla calls this Promise.resolve
	Promise.fulfill = function(value) {

	};

	Promise.reject = function(reason) {

	};

	Promise.cast = function(value) {

	};

	Promise.all = function(promiseList) {

	};

	Promise.race = function(promiseList) {

	};
})(typeof module === "undefined" ? window : module);