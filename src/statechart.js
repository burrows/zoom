// Z.State
//   raw properties:
//     name               - string, set at init
//     isConcurrent       - boolean, set at init
//     isCurrent          - boolean, set by enter/exit
//     substates          - hash mapping name to state object
//     superstate         - reference to parent
//   public methods:
//     root()             - returns the root state
//     path()             - dot separated string of state names leading to state
//     current()          - returns array of current state objects
//     currentPaths()     - returns the paths of each current state
//     send(action, args) - bubbles the action up each current state
//     goto(states)       - checks to make sure that transitions are valid, invokes enter on pivot
//   private methods:
//     enter(paths)       - enters the node, calls exit on current substate if its not on the path
//     exit()             - recursively exits the state bottom up
//     transition()       - executes queued transitions
//
// `goto` must queue transitions until all current states have had an
// opportunity to handle an action
//
// actions are sent to all current states with the `send` method called on the root state
//
// cache the following:
//   path
//   root
//   ancestorStates
//
// addSubstate must clear the cache for each state in the given tree

(function() {

var slice = Array.prototype.slice;

Z.State = Z.Object.extend(function() {
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

  function enterClustered(paths) {
    var heads = [], next, cur, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      heads.push(paths[i].shift());
    }

    if (Z.Array.create(heads).uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.enterClustered: attempted to enter multiple substates of %@: %@", this, heads.join(', ')));
    }

    cur = this.substates.values().find(function(s) { return s.isCurrent; });

    if (this.substates.size() > 0) {
      next = heads[0] ? this.substates.at(heads[0]) : this.substates.first()[1];
    }

    if (cur && cur !== next) { exit.call(cur); }

    if (!this.isCurrent) {
      this.isCurrent = true;
      this.didEnterState();
    }

    if (next) { enter.call(next, paths); }

    return this;
  }

  function enterConcurrent(paths) {
    var heads = {}, substates = this.substates, head, i, len;

    if (!this.isCurrent) {
      this.isCurrent = true;
      this.didEnterState();
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
      enter.call(tuple[1], heads[tuple[0]] || []);
    });

    return this;
  }

  function exitClustered() {
    var substate = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (substate) { exit.call(substate); }

    this.willExitState();
    this.isCurrent = false;

    return this;
  }

  function exitConcurrent() {
    this.substates.values().each(function(s) { exit.call(s); });
    this.willExitState();
    this.isCurrent = false;

    return this;
  }

  function enter(paths) {
    return this.isConcurrent ?
      enterConcurrent.call(this, paths) : enterClustered.call(this, paths);
  }

  function exit() {
    return this.isConcurrent ?
      exitConcurrent.call(this) : exitClustered.call(this);
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

  function queueTransition(pivot, paths) {
    this.__transitions__ = this.__transitions__ || [];
    this.__transitions__.push({pivot: pivot, paths: paths});
  }

  function transition() {
    var t, i, len;

    if (!this.__transitions__) { return; }

    for (i = 0, len = this.__transitions__.length; i < len; i++) {
      t = this.__transitions__[i];
      enter.call(t.pivot, t.paths);
    }

    this.__transitions__ = [];
  }

  this.def('init', function(name, opts) {
    opts = Z.defaults(opts || {}, {isConcurrent: false});

    this.name         = name;
    this.substates    = Z.H();
    this.superstate   = null;
    this.isConcurrent = opts.isConcurrent;
    this.isCurrent    = false;
  });

  this.def('toStringProperties', function() {
    return this.supr().concat('path', 'isCurrent', 'isConcurrent');
  });

  this.def('addSubstate', function(state) {
    this.substates.at(state.name, state);
    state.superstate = this;
    return this;
  });

  this.def('path', function() { return pathArray.call(this).join('.'); });

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

  this.def('root', function() {
    return this.superstate ? this.superstate.root() : this;
  });

  this.def('goto', function() {
    var self   = this,
        isRoot = !this.superstate,
        root   = isRoot ? this : this.root(),
        paths, states, pivots, pivot;

    if (!this.isCurrent && !isRoot) {
      throw new Error(Z.fmt("Z.State.goto: state %@ is not current", this));
    }

    paths  = Z.Array.create(arguments).flatten().map(function(s) { return s.split('.'); });
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
    paths = !this.superstate ? paths : paths.map(function(path) {
      return path.slice(pivot.path().split('.').length);
    });

    queueTransition.call(root, pivot, paths.toNative());

    if (!this.__isSending__) { transition.call(root); }

    return this;
  });

  this.def('send', function() {
    var args = slice.call(arguments), isRoot = !this.superstate;

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

  this.def('didEnterState', Z.identity);
  this.def('willExitState', Z.identity);
});

}());
