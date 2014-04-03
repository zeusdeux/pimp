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
				var args = arguments;
				window.setTimeout(function() {
						cb();
				}, 0);
			};
		}

		if (fn && typeof fn === "function") {
			fn(fulfill, reject);
		}

		//Privileged functions
		this.then = function(onFulfilled, onRejected) {
			var thenPromise = new Promise();
			var done = false;

			//store the handlers and the promise returned
			thenCache.push({
				promise: thenPromise,
				//2.2.1 Both onFulfilled and onRejected are optional arguments:
				//2.2.1.1 If onFulfilled is not a function, it must be ignored.
				//2.2.1.2 If onRejected is not a function, it must be ignored.
				onFulfilled: typeof onFulfilled === "function" ? onFulfilled : null,
				onRejected: typeof onRejected === "function" ? onRejected : null,
				done: done
			});

			if (state === States.fulfilled) {
				fulfill(valueOrReason);
			}
			else if (state === States.rejected) {
				reject(valueOrReason);
			}

			//2.2.7 then must return a promise 
			return thenPromise;
		};
		//figure out a way to make sure that the call to resolve is from within the library
		//and not by a naughty user and/or some other piece of non-library code
		this.resolve = function(returnVal) {

			//if resolve is called with an instance of error as its parameter, reject the promise
			if (returnVal instanceof Error) {
				return reject(returnVal);
			}
			//2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
			//var self = this;
			else if (self === returnVal) {
				return reject(new TypeError("Promise cannot resolve to itself. Sorry brah!"));
			}
			//2.3.2 If x is a promise, adopt its state 
			//(checking for States object so that I know the promise came from my implementation)
			else if (returnVal && returnVal.constructor && returnVal.constructor.name === "Promise" && States) {

				//pass fulfill and reject of current promise to promise it should resolve to in the future
				//For point 2.3.2
				returnVal.then(fulfill, reject);

				//promise should adopt state of returnVal as value is a promise
				if (returnVal.state() === States.fulfilled) {
					return fulfill(returnVal.value());
				}
				else if (returnVal.state() === States.rejected) {
					return reject(returnVal.value());
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
								return reject(r);
							});
						}
						catch (e) {
							if (returnVal.state() === States.pending) {
								return reject(e);
							}
							else {
								return false;
							}
						}
					}
					//2.3.3.4 If then is not a function, fulfill promise with x.
					else {
						return fulfill(returnVal);
					}
				}
				catch (e) {
					//2.3.3.2 If retrieving the property x.then results in a thrown exception e, 
					//reject promise with e as the reason.
					return reject(e);
				}

			}
			else if (typeof returnVal !== "object" || typeof returnVal !== "function") {
				//2.3.4 If x is not an object or function, fulfill promise with x.
				return fulfill(returnVal);
			}
		};

		this.state = function() {
			return state;
		};

		this.value = function() {
			return valueOrReason;
		};


		//Private functions
		function fulFillOrReject(actionType, value) {
			//2.2.2 If onFulfilled is a function: 
			//2.2.2.3 it must not be called more than once.
			try {
				changeState(actionType.toLowerCase());
				//2.1.2		When fulfilled, a promise:
				//2.1.2.2	must have a value, which must not change.
				valueOrReason = value;
			}
			catch (e) {
				//return e;
			}
			//2.2.2 If onFulfilled is a function: 
			//2.2.2.1 it must be called after promise is fulfilled, with promise’ s value as its first argument.
			//2.2.2.2 it must not be called before promise is fulfilled.
			for (var i in thenCache) {
				var cacheElement = thenCache[i];
				try {
					if (!cacheElement.done) {
						if (cacheElement["on" + actionType]) {
							//call the onFulfilled with a brand new stack basically
							(function(ce) {
								callAsap(function() {
									var value;
									try {
										var temp = ce["on" + actionType];
										//to call the onFulfilled or onRejected handler as a function
										//assigning to a var removes its context which is ce and makes it
										//whatever `this` is when it is called
										value = temp(valueOrReason);
										ce.promise.resolve(value);
									}
									catch (e) {
										ce.promise.resolve(e);
									}
								});
							})(cacheElement);
						}
						else {
							//if onFulfilled is not a function then resolve (fulfill it while resolving)
							//promise with value from parent promise in chain
							(function(ce) {
								callAsap(function() {
									ce.promise.resolve(valueOrReason);
								});
							})(cacheElement);

						}
					}
				}
				catch (e) {
					//resolve with error (reject it with 'e' as reason while resolving)
					(function(ce) {
						callAsap(function() {
							ce.promise.resolve(e);
						});
					})(cacheElement);

				}
				cacheElement.done = true;
			}
		}

		function fulfill(value) {
			return fulFillOrReject("Fulfilled", value);
		}

		function reject(reason) {
			return fulFillOrReject("Rejected", reason);
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

	}

	Promise.deferred = function() {
		var res, rej;
		var prom = new Promise(function(ff, rj) {
			res = ff;
			rej = rj;
		});

		return {
			promise: prom,
			resolve: res,
			reject: rej
		};

	};

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

	Promise.cast = function(value) {

	};

	Promise.all = function(promiseList) {

	};

	Promise.race = function(promiseList) {

	};
})(typeof module === "undefined" ? window : module);