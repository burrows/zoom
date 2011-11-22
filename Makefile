NODE_PATH := build

SRCS      := object.coffee array.coffee
SPECS     := $(wildcard spec/*.spec.coffee)
JSSPECS   := $(SPECS:%.coffee=%.js)

all: zoom specs

zoom: build/zoom.js

specs: $(JSSPECS)

build/zoom.js: $(addprefix src/,$(SRCS))
	./node_modules/.bin/coffee --join zoom --compile --output build $^

spec/%.js: spec/%.coffee
	./node_modules/.bin/coffee --compile $<

spec: zoom specs 
	./node_modules/.bin/jasmine-node ./spec

repl: zoom
	NODE_NO_READLINE=1 rlwrap ./node_modules/.bin/coffee -r ./util/repl.coffee -i

clean:
	rm -f $(JSSPECS)
	rm -rf ./build

.PHONY: zoom clean spec specs repl

