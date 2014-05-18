
test:
	./node_modules/promises-aplus-tests/lib/cli.js tests/compliance_adapter
	@PIMP_LIB_DIR=../lib/wrap ./node_modules/.bin/mocha tests/pimpTests.js

gen-browser:
	node ./generateBrowserVersion.js

lib-cov:
	@jscoverage lib instrumented
	PIMP_LIB_DIR=../instrumented/wrap ./node_modules/.bin/mocha -R html-cov tests/pimpTests.js > coverage.html

clean:
	rm -fr instrumented

gen-cov: clean lib-cov clean
	rm -fr instrumented

build: test gen-browser clean

.PHONY: test gen-browser lib-cov clean gen-cov build
