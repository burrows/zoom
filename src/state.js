(function() {

Z.State = Z.Object.extend(Z.Enumerable, function() {
  function _path() {
    return this.__cache__._path = this.__cache__._path ||
      (this.superstate ? _path.call(this.superstate).concat(this) : [this]);
  }

  function _current() {
    var substates = this.substates.values();

    if (!this.isCurrent) { return []; }
    if (substates.size() === 0) { return [this]; }

    return substates.inject([], function(acc, s) {
      if (s.isCurrent) { acc = acc.concat(_current.call(s)); }
      return acc;
    });
  }

  function resolve(path, origPath, origState) {
    var head, next;

    origPath  = origPath || path;
    origState = origState || this;
    path      = Z.isString(path) ? path.split('/') : path;
    head      = path.shift();

    switch (head) {
      case '':
        next = this.root();
        break;
      case '.':
        next = this;
        break;
      case '..':
        next = this.superstate;
        break;
      default:
        next = this.substates.at(head);
    }

    if (!next) {
      throw new Error(Z.fmt("Z.State.resolve: could not resolve path '%@' from state %@", origPath, origState));
    }

    return path.length === 0 ? next :
      resolve.call(next, path, origPath, origState);
  }

  function findPivot(other) {
    var p1 = _path.call(this), p2 = _path.call(other), i, len, p;

    for (i = 0, len = Z.min(p1.length, p2.length); i < len; i++) {
      if (p1[i] === p2[i]) { p = p1[i]; } else { break; }
    }

    if (!p) {
      throw new Error(Z.fmt("Z.State.pivot: states %@ and %@ do not belong to the same statechart", this, other));
    }

    return p;
  }

  function queueTransition(pivot, states, ctx) {
    (this.__transitions__ = this.__transitions__ || []).push({
      pivot: pivot, states: states, ctx: ctx});
  }

  function transition() {
    var t, i, len;

    if (!this.__transitions__) { return; }

    for (i = 0, len = this.__transitions__.length; i < len; i++) {
      t = this.__transitions__[i];
      enter.call(t.pivot, t.states, t.ctx);
    }

    this.__transitions__ = [];
  }

  function enterClustered(states, ctx) {
    var self    = this,
        root    = this.root(),
        selflen = _path.call(this).length,
        cur     = this.substates.values().find(function(s) { return s.isCurrent; }),
        nexts   = states.map(function(s) { return _path.call(s)[selflen]; }),
        next    = nexts.first();

    if (nexts.uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.enterClustered: attempted to enter multiple substates of %@: %@", this, nexts.pluck('name').join(', ')));
    }

    if (!next && this.substates.size() > 0) {
      if (this.__condition__) {
        states = Z.Array.create([this.__condition__.call(this)]).flatten().map(function(p) {
          return resolve.call(self, p);
        });
        return enterClustered.call(this, states, ctx);
      }
      else if (this.hasHistory) {
        next = this.__previous__ || this.substates.first()[1];
      }
      else {
        next = this.substates.first()[1];
      }
    }

    if (cur && cur !== next) { exit.call(cur, ctx); }

    if (!this.isCurrent) {
      if (root.trace && this !== root) {
        console.log(Z.fmt("Z.State: entering state '%@'", this.path()));
      }

      this.isCurrent = true;
      if (this.respondTo('enter')) { this.enter(ctx); }
    }

    if (next) { enter.call(next, states, ctx); }

    return this;
  }

  function enterConcurrent(states, ctx) {
    var self = this, root = this.root();

    if (!this.isCurrent) {
      if (root.trace && this !== root) {
        console.log(Z.fmt("Z.State: entering state '%@'", this.path()));
      }

      this.isCurrent = true;
      if (this.respondTo('enter')) { this.enter(ctx); }
    }

    this.substates.each(function(tuple) {
      enter.call(tuple[1],
        states.select(function(s) {
          return findPivot.call(tuple[1], s) === tuple[1];
        }), ctx);
    });

    return this;
  }

  function enter(states, ctx) {
    return this.isConcurrent ?
      enterConcurrent.call(this, states, ctx) :
      enterClustered.call(this, states, ctx);
  }

  function exitClustered(ctx) {
    var root = this.root(), cur = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (this.hasHistory) { this.__previous__ = cur; }

    if (cur) { exit.call(cur, ctx); }

    if (this.respondTo('exit')) { this.exit(ctx); }
    this.isCurrent = false;

    if (root.trace && this !== root) {
      console.log(Z.fmt("Z.State: exiting state '%@'", this.path()));
    }

    return this;
  }

  function exitConcurrent(ctx) {
    var root = this.root();

    this.substates.values().each(function(s) { exit.call(s, ctx); });
    if (this.respondTo('exit')) { this.exit(ctx); }
    this.isCurrent = false;

    if (root.trace && this !== root) {
      console.log(Z.fmt("Z.State: exiting state '%@'", this.path()));
    }

    return this;
  }

  function exit(ctx) {
    return this.isConcurrent ?
      exitConcurrent.call(this, ctx) : exitClustered.call(this, ctx);
  }

  this.def('define', function() {
    var opts = {}, f = null, s;

    if (arguments.length === 2) {
      opts = arguments[0];
      f    = arguments[1];
    }
    else if (arguments.length === 1) {
      if (typeof arguments[0] === 'function') {
        f = arguments[0];
      }
      else {
        opts = arguments[0];
      }
    }

    s = this.create('__root__', opts);
    if (f) { f.call(s); }
    return s;
  });

  this.def('state', function(name) {
    var opts = {}, f = null, s;

    if (arguments.length === 3) {
      opts = arguments[1];
      f    = arguments[2];
    }
    else if (arguments.length === 2) {
      if (typeof arguments[1] === 'function') {
        f = arguments[1];
      }
      else {
        opts = arguments[1];
      }
    }

    s = Z.State.create(name, opts);
    this.addSubstate(s);
    if (f) { f.call(s); }
    return s;
  });

  this.def('C', function(f) {
    if (this.hasHistory) {
      throw new Error(Z.fmt("Z.State.C: a state may not have both condition and history states: %@", this));
    }

    if (this.isConcurrent) {
      throw new Error(Z.fmt("Z.State.C: a concurrent state may not have a condition state: %@", this));
    }

    this.__condition__ = f;
  });

  this.def('toStringProperties', function() {
    return this.supr().concat('path', 'isCurrent', 'isConcurrent');
  });

  this.def('init', function(name, opts) {
    opts = Z.merge({}, {isConcurrent: false, hasHistory: false}, opts);

    if (opts.isConcurrent && opts.hasHistory) {
      throw new Error('Z.State.init: history states are not allowed on concurrent states');
    }

    this.name         = name;
    this.substates    = Z.H();
    this.superstate   = null;
    this.isConcurrent = opts.isConcurrent;
    this.hasHistory   = opts.hasHistory;
    this.isCurrent    = false;
    this.__cache__    = {};
    this.trace        = false;
  });

  this.def('each', function(f) {
    f(this);
    this.substates.each(function(tuple) { tuple[1].each(f); });
    return this;
  });

  this.def('addSubstate', function(state) {
    this.substates.at(state.name, state);
    state.each(function(s) { s.__cache__ = {}; });
    state.superstate = this;
    return this;
  });

  this.def('root', function() {
    return this.__cache__.root = this.__cache__.root ||
      (this.superstate ? this.superstate.root() : this);
  });

  this.def('path', function() {
    var states = _path.call(this), names = [], i, len;

    for (i = 1, len = states.length; i < len; i++) {
      names.push(states[i].name);
    }

    return '/' + names.join('/');
  });

  this.def('current', function() {
    var states = _current.call(this), paths = [], i, len;

    for (i = 0, len = states.length; i < len; i++) {
      paths.push(states[i].path());
    }

    return paths;
  });

  this.def('goto', function() {
    var self   = this,
        root   = this.root(),
        paths  = Z.Array.create(arguments).flatten(),
        opts   = Z.isObject(paths.last()) ? paths.pop() : {},
        states = paths.map(function(p) { return resolve.call(self, p); }),
        pivots = states.map(function(s) { return findPivot.call(self, s); }),
        pivot  = pivots.first() || this;

    if (root.trace) {
      console.log(Z.fmt("Z.State: transitioning to states %@", Z.inspect(arguments)));
    }

    if (!this.isCurrent && this.superstate) {
      throw new Error(Z.fmt("Z.State.goto: state %@ is not current", this));
    }

    if (pivots.uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.goto: multiple pivot states found between state %@ and paths %@", this, paths.join(', ')));
    }

    // if we're at a non-root state and the pivot is a concurrent state, then
    // we're attempting to cross a concurrency boundary, which is not allowed
    if (this.superstate && pivot.isConcurrent) {
      throw new Error(Z.fmt("Z.State.goto: one or more of the given paths are not reachable from state %@: %@", this, paths.join(', ')));
    }

    queueTransition.call(root, pivot, states, opts.context);

    if (!this.__isSending__) { transition.call(root); }

    return this;
  });

  this.def('send', function() {
    var args = Array.prototype.slice.call(arguments);

    if (!this.superstate && this.trace) {
      console.log(Z.fmt("Z.State: processing action '%@' with arguments %@", args[0], Z.inspect(args.slice(1))));
    }

    this.substates.each(function(tuple) {
      if (tuple[1].isCurrent) { tuple[1].send.apply(tuple[1], args); }
    });

    if (this.respondTo(args[0])) {
      this.__isSending__ = true;
      this[args[0]].apply(this, args.slice(1));
      this.__isSending__ = false;
    }

    if (!this.superstate) { transition.call(this); }

    return this;
  });
});

}());

