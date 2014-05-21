var PIMP_LIB_DIR = process.env.PIMP_LIB_DIR.trim();
var Pimp = require(PIMP_LIB_DIR);

if ((PIMP_LIB_DIR.split("/")[1] === "lib")) {
  console.log("\n  Using pimp.js from: " + PIMP_LIB_DIR.split("/").splice(0, 2).join("/"));
}
else {
  console.log("  <h1 id='overview' style='margin:10px 60px;'>Coverage for promises-aplus-tests</h1><p style='margin:10px 60px;display: inline-block;margin-top: 15px;border: 1px solid #EEE; \
              padding: 10px;-webkit-box-shadow: inset 0 0 2px #EEE;-moz-box-shadow: inset 0 0 2px #eee; \
              box-shadow: inset 0 0 2px #EEE;-webkit-border-radius: 5px;-moz-border-radius: 5px;\
              border-radius: 5px;color: #1BA2D6;font-size: 1.2em;'>Using pimp.js from: " 
              + PIMP_LIB_DIR.split("/").splice(0, 2).join("/") + "</p>");
}

exports.deferred = function() {
  var res, rej;
  var prom = new Pimp(function(ff, rj) {
    res = ff;
    rej = rj;
  });

  return {
    promise: prom,
    resolve: res,
    reject: rej
  };

};
