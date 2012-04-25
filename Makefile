NODE_PATH := build

CORE_SRCS := util.js         \
             object.js       \
             module.js       \
             orderable.js    \
             enumerable.js   \
             array.js        \
             sorted_array.js \
             hash.js         \
             mapper.js       \
             model.js        \
             view.js         \
						 window.js       \
						 app.js

BROWSER_SRCS := dom/view.js dom/window.js dom/app.js

default: spec

all: build/zoom-core.js build/zoom-browser.js

core: build/zoom-core.js

browser: build/zoom-browser.js

build/zoom-core.js: $(addprefix src/,$(CORE_SRCS))
	@mkdir -p build
	echo "(function() {\nvar Z; if (typeof exports !== 'undefined') { Z = exports; Z.platform = 'node'; } else { this.Z = Z = {platform: 'browser'}; }; Z.global = this;" > $@
	cat $^ >> $@
	echo "}());" >> $@

build/zoom-browser.js: $(addprefix src/,$(CORE_SRCS)) $(addprefix src/,$(BROWSER_SRCS))
	@mkdir -p build
	echo "(function() {\nvar Z; if (typeof exports !== 'undefined') { Z = exports; Z.platform = 'node'; } else { this.Z = Z = {platform: 'browser'}; }; Z.global = this;" > $@
	cat $^ >> $@
	echo "}());" >> $@

lint: core browser
	./node_modules/.bin/jshint src/*.js --config ./jshint.json

lintspec:
	./node_modules/.bin/jshint spec/*.js --config ./jshint.json

spec: core lint
	NODE_PATH=$(NODE_PATH) ./node_modules/.bin/jasmine-node ./spec

repl: core
	NODE_NO_READLINE=1 rlwrap node ./util/repl.js

clean:
	rm -rf ./build

fixme:
	ack FIXME ./src ./spec; true

autobuild:
	node ./util/autobuild.js

.PHONY: default core browser clean lint spec repl fixme

