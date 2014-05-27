#!/usr/bin/env node

var fs = require("fs");
var util = require("util");
var UglifyJS = require("uglify-js");
var Pimp = require("./lib/wrap");
var pkg = require("./package.json");
var pimpCore;
var pimpWrap;
var data;
var fileName = "pimp." + pkg.version + ".js";
var filePath = "./browser/" + fileName;
var minifiedFileName = "pimp.min.js";
var minifiedFilePath = "./browser/" + minifiedFileName;
var sourceMapName = "pimp.min.map";
var sourceMapPath = "./browser/pimp.min.map";
var promWriteFile = Pimp.denodeify(fs.writeFile);
var setImmediateSrc;

function handleError(e) {
  util.log(e.message);
  util.log(e.stack);
  util.log("Errored out");
  util.log("Exiting with code 1");
  process.exit(1);
}

console.log("\n");
util.log("Starting Pimp files generation for the browser");

util.log("Reading files");
pimpCore = fs.readFileSync("./lib/pimp.js", {
  encoding: "utf8"
});
pimpWrap = fs.readFileSync("./lib/wrap.js", {
  encoding: "utf8"
});
setImmediateSrc = fs.readFileSync("./node_modules/setimmediate/setImmediate.js", {
  encoding: "utf8"
});

data = "//setImmediate shim by YuzuJS \n";
data += "//https://github.com/YuzuJS/setImmediate\n";
data += setImmediateSrc;
data += "//Pimp core: \n";
data += pimpCore + "\n";
data += "//Pimp wrap: \n";
data += pimpWrap;

util.log("Writing " + fileName);
promWriteFile(filePath, data).then(function() {
  var minified;
  var p1, p2;

  util.log("Minifying file and generating source map");
  minified = UglifyJS.minify(filePath, {
    output: {
      preamble: "/*\n" + " * @author Pimp.js: Mudit Ameta\n" + " * @license https://github.com/zeusdeux/pimp/blob/master/LICENSE MIT\n" + " * @author setImmediate: YuzuJS\n" + " * @license https://github.com/YuzuJS/setImmediate/blob/master/LICENSE.txt\n" + " */\n//# sourceMappingURL=pimp.min.map"
    },
    outSourceMap: sourceMapName
  });

  util.log("Writing minified file " + minifiedFileName);
  p1 = promWriteFile(minifiedFilePath, minified.code).
  catch (function(e) {
    handleError(e);
    process.exit(1);
  });

  util.log("Writing sourcemap " + sourceMapName);
  p2 = promWriteFile(sourceMapPath, minified.map).
  catch (function(e) {
    handleError(e);
    process.exit(1);
  });

  return Pimp.all([p1, p2]);

}, handleError).then(function() {
  util.log("Generation successful");
  util.log("Exiting with code 0");
  util.log("All done.\n");
  process.exit(0);
}, handleError);
