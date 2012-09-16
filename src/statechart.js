// Z.State
//   name               - string, set at init
//   isConcurrent       - boolean, set at init
//   isCurrent          - boolean, set by enter/exit
//   substates          - hash mapping name to state object
//   superstate         - reference to parent
//   path               - array of state names, set during init, updated during addSubstate
//   current()          - traverse current states to leaf nodes, return list of leaf nodes
//   currentPaths()     - returns the paths of each current state
//   root()             - returns the root state
//   enter(paths)       - enters the node, calls exit on current substate if its not on the path
//   exit()             - recursively exits the state bottom up
//   send(action, args) - bubbles the action up each current state
//   goto(states)       - checks to make sure that transitions are valid, invokes enter on root

// goto(paths)
//   raise exception if not current
//   find unique pivots
//   raise exception if more than 1 unique pivot
//   strip pivot's path from beginning of each given path
//   if handling action
//     queue up transition: pivot, paths
//   else
//     pivot.enter(paths)
//
// transition
//   executes queued transitions
//   pivot.enter(paths)
//
// pivot(state)
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
      throw new Error(Z.fmt("Z.State.enter: state %@ given destination paths with inconsistent heads: %@", this, heads));
    }

    if (heads[0] && !this.substates.hasKey(heads[0])) {
      throw new Error(Z.fmt("Z.State.enter: state %@ has no substate named '%@'", this, heads[0]));
    }

    cur = this.substates.values().find(function(s) { return s.isCurrent; });

    if (this.substates.size() > 0) {
      next = heads[0] ? this.substates.at(heads[0]) : this.substates.first()[1];
    }

    if (cur && cur !== next) { cur.exit(); }

    if (!this.isCurrent) {
      this.isCurrent = true;
      this.didEnterState();
    }

    if (next) { next.enter(paths); }

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
      tuple[1].enter((heads[tuple[0]] || []));
    });

    return this;
  }

  function exitClustered() {
    var substate = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.exit: state %@ is not current", this));
    }

    if (substate) { substate.exit(); }

    this.willExitState();
    this.isCurrent = false;

    return this;
  }

  function exitConcurrent() {
    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.exit: state %@ is not current", this));
    }

    this.substates.values().invoke('exit');
    this.willExitState();
    this.isCurrent = false;

    return this;
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

  this.def('init', function(name, opts) {
    opts = Z.defaults(opts || {}, {isConcurrent: false});

    this.name         = name;
    this.substates    = Z.H();
    this.superstate   = null;
    this.isConcurrent = opts.isConcurrent;
    this.isCurrent    = false;
  });

  this.def('toStringProperties', function() {
    return this.supr().concat('name', 'isConcurrent');
  });

  this.def('addSubstate', function(state) {
    this.substates.at(state.name, state);
    state.superstate = this;
    return this;
  });

  this.def('path', function() {
    return this.superstate ?
      this.superstate.path().concat(this.name) : [];
  });

  this.def('enter', function(paths) {
    return this.isConcurrent ?
      enterConcurrent.call(this, paths) : enterClustered.call(this, paths);
  });

  this.def('exit', function() {
    return this.isConcurrent ?
      exitConcurrent.call(this) : exitClustered.call(this);
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

  this.def('root', function() {
    return this.superstate ? this.superstate.root() : this;
  });

  this.def('goto', function() {
    var self  = this,
        root  = this.root(),
        paths, states, pivots, pivot;

    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.goto: state %@ is not current", this));
    }

    paths  = Z.Array.create(arguments).flatten().map(function(s) { return s.split('.'); });
    states = paths.map(function(path) { return resolvePath.call(root, path); });
    pivots = states.map(function(state) { return findPivot.call(self, state); });

    if (pivots.uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.goto: multiple pivot states found between state %@ and paths %@", this, paths.map(function(p) { return p.join('.'); }).join(', ')));
    }

    pivots.each(function(pivot, i) {
      if (pivot.isConcurrent) {
        throw new Error(Z.fmt("Z.State.goto: path '%@' is not reachable from state %@", paths.at(i).join('.'), self));
      }
    });

    pivot = pivots.at(0);

    paths = paths.map(function(path) {
      return path.slice(pivot.path().length);
    });

    pivot.enter(paths.toNative());

    return this;
  });

  this.def('didEnterState', Z.identity);
  this.def('willExitState', Z.identity);
});

}());
