NODE_PATH := build
SPEC ?= ./spec

SRCS := util.js         \
        object.js       \
        module.js       \
        orderable.js    \
        enumerable.js   \
        array.js        \
        sorted_array.js \
        hash.js         \
        mapper.js       \
        model.js        \
        state.js        \
        event.js        \
        run_loop.js     \
        view.js         \
        window.js       \
        app.js          \
        list_view.js

default: spec

zoom: build/zoom.js

build/zoom.js: $(addprefix src/,$(SRCS))
	@mkdir -p build
	echo "(function() {\nvar Z; if (typeof exports !== 'undefined') { Z = exports; Z.platform = 'node'; } else { this.Z = Z = {platform: 'browser'}; }; Z.global = this;" > $@
	cat $^ >> $@
	echo "}());" >> $@

lint: zoom
	./node_modules/.bin/jshint src/*.js --config ./jshint.json

lintspec:
	./node_modules/.bin/jshint spec/*.js --config ./jshint.json

spec: zoom lint
	NODE_PATH=$(NODE_PATH) ./node_modules/.bin/jasmine-node $(SPEC)

repl: zoom
	env NODE_NO_READLINE=1 rlwrap node ./util/repl.js

clean:
	rm -rf ./build

fixme:
	ack FIXME ./src ./spec; true

autobuild:
	node ./util/autobuild.js

.PHONY: default zoom clean lint spec repl fixme

