
test:
	@PIMP_LIB_DIR=../lib/pimp ./node_modules/promises-aplus-tests/lib/cli.js tests/compliance_adapter
	@PIMP_LIB_DIR=../lib/wrap ./node_modules/.bin/mocha tests/pimpTests.js

gen-browser:
	node ./generateBrowserVersion.js

instrument: clean
	@jscoverage lib instrumented

lib-cov:
	@PIMP_LIB_DIR=../instrumented/pimp ./node_modules/promises-aplus-tests/lib/cli.js tests/compliance_adapter reporter html-cov > aplus_tests_coverage.html
	@PIMP_LIB_DIR=../instrumented/wrap ./node_modules/.bin/mocha -R html-cov tests/pimpTests.js > Pimp_tests_coverage.html

clean:
	rm -fr instrumented

gen-cov: instrument lib-cov
	rm -fr instrumented

build: test gen-browser clean

.PHONY: test gen-browser lib-cov clean gen-cov build
