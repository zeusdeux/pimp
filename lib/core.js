(function(global) {
	'use strict';

	//http://promises-aplus.github.io/promises-spec/
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
		pending: 0,
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

		//setup a callAsap method to call asap on next tick or next iteration of event loop
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
				onFulfilled: typeof onFulfilled === "function" && onFulfilled,
				onRejected: typeof onRejected === "function" && onRejected
			});

			return thenPromise;
		};

		//figure out a way to make sure that the call to resolve is from within the library
		//and not by a naughty user and/or some other piece of non-library code
		this.resolve = function(returnVal) {
			if (this === returnVal) {
				throw new TypeError("Promise cannot resolve to itself. Sorry brah!");
			}
			else if (returnVal.constructor.name === "Promise") {
				//promise should adopt state of returnVal as value is a promise
				adoptCurrentState(returnVal.state, returnVal.value);
				//add someway to adopt future state
			}
			else if (typeof returnVal === "object" || typeof returnVal === "function") {

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
			changeState("fulfilled");
			//2.1.2		When fulfilled, a promise:
			//2.1.2.2	must have a value, which must not change.
			valueOrReason = value;

			for (var i in thenCache) {
				var cacheElement = thenCache[i];
				try {
					if (cacheElement["onFulfilled"]) {
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
		}

		function reject(reason) {
			changeState("rejected");
			//2.1.3		When rejected, a promise:
			//2.1.3.2	must have a reason, which must not change.
			valueOrReason = reason;

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
		}

		function changeState(newState) {
			var newStateVal = States[newState];
			//The new state should be either pending, fulfilled or rejected
			if (!newStateVal) {
				throw new TypeError("State has to be fulfilled, rejected or pending.");
			}
			//2.1.1		When pending, a promise:
			//2.1.1.1	may transition to either the fulfilled or rejected state.
			if (state === States.pending && newStateVal !== States.pending) {
				state = newStateVal;
			}
			else {
				//2.1.2		When fulfilled, a promise: 
				//2.1.2.1	must not transition to any other state.
				//2.1.3		When rejected, a promise: 
				//2.1.3.1	must not transition to any other state.
				throw new TypeError("State cannot be changed once fulfilled or " +
					"rejected nor can it be made pending when already pending.");
			}

		}

		function adoptCurrentState(newState, value) {
			try {
				changeState(newState);
				valueOrReason = value;
			}
			catch (e) {
				//throw to caller
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