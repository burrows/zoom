NODE_PATH := build

SRCS := main.js         \
        util.js         \
        object.js       \
        module.js       \
        orderable.js    \
        enumerable.js   \
        array.js        \
				sorted_array.js \
        hash.js         \
        mapper.js       \
        model.js

default: spec

zoom: build/zoom.js

build/zoom.js: $(addprefix src/,$(SRCS))
	@mkdir -p build
	cat $^ > $@

lint: zoom
	./node_modules/.bin/jshint src/*.js --config ./jshint.json

lintspec:
	./node_modules/.bin/jshint spec/*.js --config ./jshint.json

spec: zoom lint
	NODE_PATH=$(NODE_PATH) ./node_modules/.bin/jasmine-node ./spec

repl: zoom
	NODE_NO_READLINE=1 rlwrap node ./util/repl.js

clean:
	rm -rf ./build

fixme:
	ack FIXME ./src ./spec; true

.PHONY: default zoom clean lint spec repl fixme

