require("should");
var PIMP_LIB_DIR = process.env.PIMP_LIB_DIR.trim();
var Pimp = require(PIMP_LIB_DIR);
var helper = require("./pimpTestsHelper");
var nodeReadFile = require("fs").readFile;
var dir = PIMP_LIB_DIR.split("/");

var logMsgs = {
  lib: function() {
    console.log("  Using wrap.js and pimp.js from: " + dir.slice(0, 2).join("/"));
  },
  browser: function() {
    console.log("  Using Pimp for the browser (with setImmediate by YuzuJS): "+dir.slice(1).join("/")+".js");
  },
  instrumented: function() {
    console.log("  <h1 id='overview' style='margin:10px 60px 0 60px;'>Coverage for Pimp test suite</h1><p style='margin:10px 60px;display: inline-block;margin-top: 15px;border: 1px solid #EEE; \
              padding: 10px;-webkit-box-shadow: inset 0 0 2px #EEE;-moz-box-shadow: inset 0 0 2px #eee; \
              box-shadow: inset 0 0 2px #EEE;-webkit-border-radius: 5px;-moz-border-radius: 5px;\
              border-radius: 5px;color: #1BA2D6;font-size: 1.2em;'>Using wrap.js and pimp.js from: " + dir.slice(0, 2).join("/") + "</p>");
  }
};

logMsgs[dir[1]]();

describe("pimp", function() {
  describe("#inspect", function() {
    describe("when a promise is fulfilled with a value", function() {
      it("should return state as 'fulfilled' and value as the value it was resolved with", function() {
        var p = new Pimp(function(f, r) {
          f(10);
        });
        p.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "fulfilled",
          value: 10
        });
      });
    });
    describe("when a promise is rejected with a value", function() {
      it("should return state as 'rejected' and reason as the value it was rejected with", function() {
        var p = new Pimp(function(f, r) {
          r(10);
        });
        p.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "rejected",
          reason: 10
        });
      });
    });
    describe("when a promise is pending", function() {
      it("should return state as 'pending'", function() {
        var p = new Pimp(function(f, r) {
          setTimeout(function() {
            f(20);
          }, 1000);
        });
        p.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "pending"
        });
      });
    });
    describe("when a pending promise changes state to fulfilled", function() {
      it("should return the new state and value", function(done) {
        var p = new Pimp(function(f, r) {
          setTimeout(function() {
            f(10);
          }, 500);
        });
        p.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "pending"
        });
        p.then(function() {
          try {
            p.inspect().should.be.an.instanceOf(Object).and.have.properties({
              state: "fulfilled",
              value: 10
            });
            done();
          }
          catch (e) {
            done(e);
          }

        });
      });
    });
    describe("when a pending promise gets rejected", function() {
      it("should return the new state and reason", function(done) {
        var p = new Pimp(function(f, r) {
          setTimeout(function() {
            r(10);
          }, 500);
        });
        p.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "pending"
        });
        p.then(null, function() {
          try {
            p.inspect().should.be.an.instanceOf(Object).and.have.properties({
              state: "rejected",
              reason: 10
            });
            done();
          }
          catch (e) {
            done(e);
          }

        });
      });
    });
  });
  describe("#catch", function() {
    describe("when a promise rejects", function() {
      it("should call the method passed to it with rejection reason", function(done) {
        var p = new Pimp(function(f, r) {
          r(10);
        });
        p.
        catch (function(reason) {
          try {
            p.inspect().should.be.an.instanceOf(Object).and.have.properties({
              state: "rejected",
              reason: 10
            });
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    describe("when a promise fulfills", function() {
      it("should not call the method passed to it", function(done) {
        var p = new Pimp(function(f, r) {
          f(10);
        });
        p.
        catch (function(reason) {
          return -1;
        }).then(function(v) {
          try {
            v.should.be.exactly(10, "the method in catch was called even though promise fulfilled");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
  });
  describe("#done", function() {
    //stub
  });
  describe("#resolve", function() {
    describe("when passed a non-thenable value (e.g., a string or number)", function() {
      it("should return a promise that is resolved to the passed value", function() {
        var p = Pimp.resolve(10);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "fulfilled",
          value: 10
        });
      });
    });
    describe("when passed a thenable value", function() {
      it("should return a promise that will 'follow' that thenable, adopting its eventual state", function(done) {
        var p1 = new Pimp(function(f, r) {
          setTimeout(function() {
            f(20);
          }, 500);
        });
        var p2 = Pimp.resolve(p1);
        p2.should.be.an.instanceOf(Pimp);
        p2.should.have.property("then");
        p2.inspect().should.be.an.instanceOf(Object).and.have.properties({
          state: "pending"
        });
        p2.then(function(v) {
          try {
            v.should.be.exactly(20, "the promise returned by Pimp.resolve did not resolve to the thenable that was passed to it");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
  });
  describe("#reject", function() {
    it("should return a promise that is rejected with a given reason", function(done) {
      var p1 = Pimp.reject(100);
      var p2 = new Pimp(function(f, r) {
        setTimeout(function() {
          f(20);
        }, 500);
      });
      //passing a thenable to Pimp.reject
      var p3 = Pimp.reject(p2);

      p1.should.be.an.instanceOf(Pimp);
      p1.should.have.property("then");
      p1.inspect().should.be.an.instanceOf(Object).and.have.properties({
        state: "rejected",
        reason: 100
      });

      p3.should.be.an.instanceOf(Pimp);
      p3.should.have.property("then");
      p3.then(function(v) {
        done(new Error("Promise returned by Pimp.reject got resolved instead of rejected."));
      }, function(v) {
        done();
      });
    });
  });
  describe("#cast", function() {
    it("should return a promise", function() {
      var p = Pimp.cast("test");
      p.should.be.an.instanceOf(Pimp).and.have.property("then");
      p.inspect().should.have.property("value", "test");
    });
    describe("when it receives a promise generated by its parent implementation", function() {
      it("should return back that promise and not wrap it in another promise", function() {
        var p1 = Pimp.reject(-1);
        var p2 = Pimp.cast(p1);
        p2.should.be.exactly(p1);
      });
    });
  });
  describe("#all", function() {
    describe("when all the promises in the iterable resolve", function() {
      it("should return a promise that resolves to an array of values that the promises in the iterable resolved to", function(done) {
        var iterable = helper.resolvedPromisesArrayDelayedByTime(1000);
        var p = Pimp.all(iterable);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        p.then(function(v) {
          try {
            v.should.be.an.Array;
            v.length.should.be.exactly(4);
            v.should.containEql("one", "array of values returned by Pimp.all doesn't contain a value");
            v.should.containEql("two", "array of values returned by Pimp.all doesn't contain a value");
            v.should.containEql("three", "array of values returned by Pimp.all doesn't contain a value");
            v.should.containEql("four", "array of values returned by Pimp.all doesn't contain a value");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    describe("when a promise in the iterable rejects", function() {
      it("should immediately reject with the value of the promise that rejected, discarding all the other promises whether or not they have resolved", function(done) {
        var pr = Pimp.reject("gtfo");
        var iterable = helper.resolvedPromisesArrayDelayedByTime(1000);
        iterable.push(pr);
        var p = Pimp.all(iterable);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        p.
        catch (function(v) {
          try {
            v.should.be.exactly("gtfo", "promise returned by Pimp.all rejected with a value other than that of the rejected promise");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    it("should throw when it is called with non-array param or empty array", function() {
      Pimp.all.bind(null, "test").should.
      throw ("Pimp.all needs to be passed an array");
      Pimp.all.bind(null, []).should.
      throw ("Pimp.all needs an array of length >= 1");
      Pimp.all.bind(null, [1, "test", false]).should.not.
      throw ();
    });
  });
  describe("#allFail", function() {
    describe("when all the promises in the iterable reject", function() {
      it("should return a promise that resolves to an array of reasons that the promises in the iterable rejected with", function(done) {
        var iterable = helper.rejectedPromisesArrayDelayedByTime(1000);
        var p = Pimp.allFail(iterable);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        p.then(function(v) {
          try {
            v.should.be.an.Array;
            v.length.should.be.exactly(4);
            v.should.containEql("one", "array of values returned by Pimp.all doesn't contain a value");
            v.should.containEql("two", "array of values returned by Pimp.all doesn't contain a value");
            v.should.containEql("three", "array of values returned by Pimp.all doesn't contain a value");
            v.should.containEql("four", "array of values returned by Pimp.all doesn't contain a value");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    describe("when a promise in the iterable resolves", function() {
      it("should immediately reject with the value of the promise that resolved, discarding all the other promises whether or not they have resolved", function(done) {
        var pr = Pimp.resolve("gtfo");
        var iterable = helper.rejectedPromisesArrayDelayedByTime(1000);
        iterable[2] = pr; //sticking it somewhere in the middle of the promiseList/iterable
        var p = Pimp.allFail(iterable);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        p.
        catch (function(v) {
          try {
            v.should.be.exactly("gtfo", "promise returned by Pimp.all rejected with a value other than that of the rejected promise");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    it("should throw when it is called with non-array param or empty array", function() {
      Pimp.allFail.bind(null, "test").should.
      throw ("Pimp.allFail needs to be passed an array");
      Pimp.allFail.bind(null, []).should.
      throw ("Pimp.allFail needs an array of length >= 1");
      Pimp.allFail.bind(null, [1, "test", false]).should.not.
      throw ();
    });
  });
  describe("#race", function() {
    describe("when the first action to occur in the race is a resolution", function() {
      it("should return a promise that resolves to the value of the promise that resolved", function(done) {
        var iterable = helper.resolveRacewithOne();
        var p = Pimp.race(iterable);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        p.then(function(v) {
          try {
            v.should.be.exactly("one", "promise resolved with the wrong value " + v + " instead of 'one'");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    describe("when the first action to occur in the race is a rejection", function() {
      it("should return a promise that rejects with the reason of the promise that rejected", function(done) {
        var iterable = helper.rejectRacewithOne();
        var p = Pimp.race(iterable);
        p.should.be.an.instanceOf(Pimp);
        p.should.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        p.
        catch (function(v) {
          try {
            v.should.be.exactly("one", "promise resolved with the wrong value " + v + " instead of 'one'");
            done();
          }
          catch (e) {
            done(e);
          }
        });
      });
    });
    it("should throw when it is called with non-array param or empty array", function() {
      Pimp.race.bind(null, "test").should.
      throw ("Pimp.race needs to be passed an array");
      Pimp.race.bind(null, []).should.
      throw ("Pimp.race needs an array of length >= 1");
      Pimp.race.bind(null, [1, "test", false]).should.not.
      throw ();
    });
  });
  describe("#deferred", function() {
    ! function() {
      var p = Pimp.deferred();
      it("should return an object consisting of {promise, resolve, reject}", function() {
        p.should.have.properties("promise", "resolve", "reject");
        p.promise.should.be.an.instanceOf(Pimp).and.have.property("then");
      });
      it("should return a promise in the object that is in the pending state initially", function() {
        p.promise.inspect().state.should.be.exactly("pending");
      });
    }();
    describe("when resolve from the object is called on the promise in the object with a value", function() {
      it("should resolve the promise with the given value", function() {
        var p = Pimp.deferred();
        p.resolve(10);
        p.promise.inspect().should.have.properties({
          state: "fulfilled",
          value: 10
        });
      });
    });
    describe("when reject from the object is called on the promise in the object with a reason", function() {
      it("should reject the promise with the given reason", function() {
        var p = Pimp.deferred();
        p.reject("well this failed");
        p.promise.inspect().should.have.properties({
          state: "rejected",
          reason: "well this failed"
        });
      });
    });
  });
  describe("#denodeify", function() {
    var promisifiedReadFile = Pimp.denodeify(nodeReadFile);
    it("should return a promisified version of a callback style node function", function() {
      promisifiedReadFile("./readFileTest.json").should.be.an.instanceOf(Pimp).and.have.property("then");
    });
    describe("when the callback style function errors", function() {
      it("should reject with the error from the underlying callback style function", function(done) {
        promisifiedReadFile("./thisfiledoesntexist").
        catch (function(v) {
          done();
        });
      });
    });
    describe("when the callback style function succeeds", function() {
      it("should resolve with the value received from the underlying callback style function", function(done) {
        promisifiedReadFile("./tests/readFileTest.json", {
          encoding: "utf8"
        }).then(function(data) {
          try {
            JSON.parse(data).that.rustled.should.be.exactly("my jimmies");
            done();
          }
          catch (e) {
            done(e);
          }
        }, done);
      });
    });
    it("should throw when it is called with a non-function parameter", function() {
      Pimp.denodeify.bind(null, "test").should.
      throw ("Pimp.denodeify needs to be passed a function to promisify");
      Pimp.denodeify.bind(null, function() {
        console.log("boop");
      }).should.not.
      throw ();
    });
    describe("when a function that doesnt accept a callback is passed to it", function() {
      it("should return a function that returns a promise that shall never resolve", function(done) {
        var fn = Pimp.denodeify(function(v) {});
        var p = fn(10);
        p.should.be.an.instanceOf(Pimp).and.have.property("then");
        p.inspect().state.should.be.exactly("pending");
        setTimeout(function() {
          try {
            p.inspect().state.should.be.exactly("pending");
            done();
          }
          catch (e) {
            done(e);
          }
        }, 0);
      });
    });
  });
});
