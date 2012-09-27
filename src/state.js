(function(undefined) {

var slice = Array.prototype.slice;

Z.State = Z.Object.extend(Z.Enumerable, function() {
  function pathArray() {
    return this.superstate ?
      pathArray.call(this.superstate).concat(this.name) : [];
  }

  function resolvePath(path) {
    var head = path[0], state = this.substates.at(head);

    if (!state) {
      throw new Error(Z.fmt("Z.State.resolvePath: state %@ has no substate named '%@'", this, head));
    }

    return path.length === 1 ? state : resolvePath.call(state, path.slice(1));
  }

  function enterClustered(paths, ctx) {
    var heads = [], next, cur, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      heads.push(paths[i].shift());
    }

    if (Z.Array.create(heads).uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.enterClustered: attempted to enter multiple substates of %@: %@", this, heads.join(', ')));
    }

    cur = this.substates.values().find(function(s) { return s.isCurrent; });

    if (this.substates.size() > 0) {
      if (heads[0]) {
        next = this.substates.at(heads[0]);
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
      if (this.root().trace && this !== this.root()) {
        console.log(Z.fmt("Z.State.enter: entering state '%@'", this.path()));
      }

      this.isCurrent = true;
      if (this.respondTo('enter')) { this.enter(ctx); }
    }

    if (next) { enter.call(next, paths, ctx); }

    return this;
  }

  function enterConcurrent(paths, ctx) {
    var heads = {}, substates = this.substates, head, i, len;

    if (!this.isCurrent) {
      if (this.root().trace && this !== this.root()) {
        console.log(Z.fmt("Z.State.enter: entering state '%@'", this.path()));
      }

      this.isCurrent = true;
      if (this.respondTo('enter')) { this.enter(ctx); }
    }

    for (i = 0, len = paths.length; i < len; i++) {
      head = paths[i].shift();

      if (head) {
        heads[head] = heads[head] || [];
        heads[head].push(paths[i]);
      }
    }

    for (head in heads) {
      if (!heads.hasOwnProperty(head)) { continue; }
      if (substates.hasKey(head)) { continue; }
      throw new Error(Z.fmt("Z.State.enter: state %@ has no substate named '%@'", this, head));
    }

    substates.each(function(tuple) {
      enter.call(tuple[1], heads[tuple[0]] || [], ctx);
    });

    return this;
  }

  function enter(paths, ctx) {
    return this.isConcurrent ?
      enterConcurrent.call(this, paths, ctx) :
      enterClustered.call(this, paths, ctx);
  }

  function exitClustered(ctx) {
    var substate = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (this.hasHistory) { this.__previous__ = substate; }

    if (substate) { exit.call(substate, ctx); }

    if (this.respondTo('exit')) { this.exit(ctx); }
    this.isCurrent = false;

    if (this.root().trace && this !== this.root()) {
      console.log(Z.fmt("Z.State.exit: exiting state '%@'", this.path()));
    }

    return this;
  }

  function exitConcurrent(ctx) {
    this.substates.values().each(function(s) { exit.call(s, ctx); });
    if (this.respondTo('exit')) { this.exit(ctx); }
    this.isCurrent = false;

    if (this.root().trace && this !== this.root()) {
      console.log(Z.fmt("Z.State.exit: exiting state '%@'", this.path()));
    }

    return this;
  }

  function exit(ctx) {
    return this.isConcurrent ?
      exitConcurrent.call(this, ctx) : exitClustered.call(this, ctx);
  }

  function ancestors() {
    var s = this, a = [];

    while (s) {
      a.unshift(s);
      s = s.superstate;
    }

    return a;
  }

  function findPivot(other) {
    var a1 = ancestors.call(this), a2 = ancestors.call(other), i, len, p;

    for (i = 0, len = Z.min(a1.length, a2.length); i < len; i++) {
      if (a1[i] === a2[i]) { p = a1[i]; } else { break; }
    }

    if (!p) {
      throw new Error(Z.fmt("Z.State.pivot: states %@ and %@ do not belong to the same statechart", this, other));
    }

    return p;
  }

  function queueTransition(pivot, paths, ctx) {
    this.__transitions__ = this.__transitions__ || [];
    this.__transitions__.push({pivot: pivot, paths: paths, ctx: ctx});
  }

  function transition() {
    var t, i, len;

    if (!this.__transitions__) { return; }

    for (i = 0, len = this.__transitions__.length; i < len; i++) {
      t = this.__transitions__[i];
      enter.call(t.pivot, t.paths, t.ctx);
    }

    this.__transitions__ = [];
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

  this.def('init', function(name, opts) {
    opts = Z.defaults(opts || {}, {isConcurrent: false, hasHistory: false});

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

  this.def('toStringProperties', function() {
    return this.supr().concat('path', 'isCurrent', 'isConcurrent');
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
    return this.__cache__.path = this.__cache__.path ||
      pathArray.call(this).join('.');
  });

  this.def('current', function() {
    var substates = this.substates.values();

    if (!this.isCurrent) { return null; }
    if (substates.size() === 0) { return [this]; }

    return substates.inject([], function(acc, s) {
      if (s.isCurrent) { acc = acc.concat(s.current()); }
      return acc;
    });
  });

  this.def('currentPaths', function() {
    var states = this.current(), paths = [], i, len;

    for (i = 0, len = states.length; i < len; i++) {
      paths.push(states[i].path());
    }

    return paths;
  });

  this.def('goto', function() {
    var self   = this,
        isRoot = !this.superstate,
        root   = isRoot ? this : this.root(),
        paths, states, pivots, pivot, ctx;

    if (root.trace) {
      console.log(Z.fmt("Z.State.goto: transitioning to states %@", Z.inspect(arguments)));
    }

    if (!this.isCurrent && !isRoot) {
      throw new Error(Z.fmt("Z.State.goto: state %@ is not current", this));
    }

    paths  = Z.Array.create(arguments).flatten();
    ctx    = typeof paths.last() !== 'string' ? paths.pop() : undefined;
    paths  = paths.map(function(s) { return s.split('.'); });
    states = paths.map(function(path) { return resolvePath.call(root, path); });
    pivots = this.superstate ?
      states.map(function(state) { return findPivot.call(self, state); }) :
      Z.A(this);

    if (pivots.uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.goto: multiple pivot states found between state %@ and paths %@", this, paths.map(function(p) { return p.join('.'); }).join(', ')));
    }

    pivot = pivots.at(0);

    // if we're at a non-root state and the pivot is a concurrent state, then
    // we're attempting to cross a concurrency boundary, which is not allowed
    if (!isRoot && pivot.isConcurrent) {
      throw new Error(Z.fmt("Z.State.goto: one or more of the given paths are not reachable from state %@: %@", this, paths.map(function(p) { return p.join('.'); }).join(', ')));
    }

    // trim the pivot state's path from the destination paths
    if (pivot.superstate) {
      paths = !this.superstate ? paths : paths.map(function(path) {
        return path.slice(pivot.path().split('.').length);
      });
    }

    queueTransition.call(root, pivot, paths.toNative(), ctx);

    if (!this.__isSending__) { transition.call(root); }

    return this;
  });

  this.def('send', function() {
    var args = slice.call(arguments), isRoot = !this.superstate;

    if (isRoot && this.trace) {
      console.log(Z.fmt("Z.State.send: processing action '%@' with arguments %@", args[0], Z.inspect(args.slice(1))));
    }

    this.substates.each(function(tuple) {
      if (tuple[1].isCurrent) { tuple[1].send.apply(tuple[1], args); }
    });

    if (this.respondTo(args[0])) {
      this.__isSending__ = true;
      this[args[0]].apply(this, args.slice(1));
      this.__isSending__ = false;
    }

    if (isRoot) { transition.call(this); }

    return this;
  });
});

}());
