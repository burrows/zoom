NODE_PATH := build

SRCS := zoom.js

default: spec

all: zoom

zoom: build/zoom.js

build/zoom.js: $(addprefix src/,$(SRCS))
	cat $^ > $@

spec: zoom
	./node_modules/.bin/jasmine-node ./spec

repl: zoom
	NODE_NO_READLINE=1 rlwrap node -r ./util/repl.js -i

clean:
	rm -rf ./build

fixme:
	ack FIXME ./src

.PHONY: default zoom clean spec repl fixme

