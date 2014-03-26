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

	var States = {
		pending: 0,
		fulfilled: 1,
		rejected: -1
	};

	if (Object.freeze){
		Object.freeze(States);
	}

	function Promise(fn) {

		var state = States.pending;
		var valueOrReason;
		var callAsap;

		try {
			//if node
			if (process && process.nextTick) {
				callAsap = process.nextTick;
			} else if (setImmediate) {
				callAsap = setImmediate;
			}
		} catch (e) {
			//browser
			callAsap = function(cb) {
				window.setTimeout(cb, 0);
			}
		}

		//mozilla calls fulfill as resolve
		if ( !! fn && typeof fn === "Function") {
			fn(fulfill, reject);
		}

		this.then = function(onFulfilled, onRejected) {

		}

		function fulfill(value) {

		}

		function reject(reason) {

		}

		function resolve(promise, value) {
			if (promise === value) {
				throw TypeError("Promise cannot resolve to itself. Sorry brah!");
			} else if (value.constructor.name === "Promise") {
				//promise should adopt state of value as value is a promise
			} else if (typeof value === "Object" || typeof value === "Function") {

			}
		}

		function changeState(newState, valOrReason) {
			if (state === States.pending) {
				state = newState;
				valueOrReason = valOrReason;
			} else {
				throw TypeError("State cannot be changed once fulfilled or rejected.");
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

	}

	Promise.race = function(promiseList) {

	};
})(typeof module === "undefined" ? window : module);