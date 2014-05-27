var Pimp;

if (process.env.PIMP_BROWSER_TEST) Pimp = require(process.env.PIMP_LIB_DIR.trim());
else Pimp = require("../lib/wrap");


exports.resolveRacewithOne = function() {
  return [
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, 100, "one");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, 200, "two");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, 300, "three");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, 400, "four");
    })
  ];
};

exports.rejectRacewithOne = function() {
  return [
    new Pimp(function(resolve, reject) {
      setTimeout(reject, 100, "one");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(reject, 200, "two");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(reject, 300, "three");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(reject, 400, "four");
    })
  ];
};

exports.resolvedPromisesArrayDelayedByTime = function(time) {
  return [
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, Math.random() * time, "one");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, Math.random() * time, "two");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, Math.random() * time, "three");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(resolve, Math.random() * time, "four");
    })
  ];
};

exports.rejectedPromisesArrayDelayedByTime = function(time) {
  return [
    new Pimp(function(resolve, reject) {
      setTimeout(reject, Math.random() * time, "one");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(reject, Math.random() * time, "two");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(reject, Math.random() * time, "three");
    }),
    new Pimp(function(resolve, reject) {
      setTimeout(reject, Math.random() * time, "four");
    })
  ];
};
