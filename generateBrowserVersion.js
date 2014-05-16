#!/usr/bin/env node

var fs = require("fs");
var util = require("util");
var UglifyJS = require("uglify-js");
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

try {
  util.log("Starting Pimp files generation for the browser:");
  pimpCore = fs.readFileSync("./lib/pimp.js", {
    encoding: "utf8"
  });

  pimpWrap = fs.readFileSync("./lib/wrap.js", {
    encoding: "utf8"
  });

  data = "//Pimp core: \n";
  data += pimpCore + "\n";
  data += "//Pimp wrap: \n";
  data += pimpWrap;

  util.log("Writing " + fileName);
  fs.writeFile(filePath, data, function(err) {
    var minified;
    var processCount = 0;
    if (err) {
      process.exit(1);
    }
    else {
      util.log("Minifying file and generating source map");
      minified = UglifyJS.minify(filePath, {
        output: {
          preamble: '/*\n' + ' * @author  Mudit Ameta\n' + ' * @license https://github.com/zeusdeux/pimp/blob/master/LICENSE MIT\n' + ' */\n//# sourceMappingURL=pimp.min.map'
        },
        outSourceMap: sourceMapName
      });
      util.log("Writing minified file " + minifiedFileName);
      fs.writeFile(minifiedFilePath, minified.code, function(err) {
        if (err)
          process.exit(1);
        else {
          util.log("Done writing minified file");
          processCount += 1;
          if (processCount === 2) {
            util.log("All done.");
            process.exit(0);
          }
        }
      });

      util.log("Writing sourcemap " + sourceMapName);
      fs.writeFile(sourceMapPath, minified.map, function(err) {
        if (err)
          process.exit(1);
        else {
          util.log("Done writing sourcemap");
          processCount += 1;
          if (processCount === 2) {
            util.log("All done.");
            process.exit(0);
          }
        }
      });
    }
  });
}
catch (e) {
  process.exit(1);
}
