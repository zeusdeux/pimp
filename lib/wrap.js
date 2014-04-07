var Pimp = require('./pimp');

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
  return Pimp.resolve(value);
};

Pimp.all = function(promiseList) {
  return new Pimp(function(f, rej) {
    var count = 0;
    var resArray = [];
    for (var i in promiseList) {
      if (!promiseList[i].then) promiseList[i] = Pimp.cast(promiseList[i]);
      promiseList[i].then(function(v) {
        count++;
        resArray.push(v);
        if (promiseList.length === count) f(resArray);
      }, function(r) {
        rej(r);
      });
    }
  });
};

Pimp.allFail = function(promiseList) {
  return new Pimp(function(f, rej) {
    var count = 0;
    var resArray = [];
    for (var i in promiseList) {
      if (!promiseList[i].then) promiseList[i] = Pimp.cast(promiseList[i]);
      promiseList[i].then(function(v) {
        f(v);
      }, function(r) {
        count++;
        resArray.push(r);
        if (promiseList.length === count) rej(resArray);
      });
    }
  });
};

Pimp.race = function(promiseList) {
  return new Pimp(function(f, rej) {
    for (var i in promiseList) {
      if (!promiseList[i].then) promiseList[i] = Pimp.cast(promiseList[i]);
      promiseList[i].then(function(v) {
        f(v);
      }, function(r) {
        rej(r);
      });
    }
  });
};

module.exports = Pimp;
