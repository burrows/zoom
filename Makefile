NODE_PATH := build

SRCS := zoom.js object.js module.js orderable.js

default: spec

zoom: build/zoom.js

build/zoom.js: $(addprefix src/,$(SRCS))
	@mkdir -p build
	cat $^ > $@

lint: zoom
	./node_modules/.bin/jshint src/*.js

spec: zoom lint
	./node_modules/.bin/jasmine-node ./spec

repl: zoom
	NODE_NO_READLINE=1 rlwrap node ./util/repl.js

clean:
	rm -rf ./build

fixme:
	ack FIXME ./src

.PHONY: default zoom clean lint spec repl fixme

