(function() {

var slice = Array.prototype.slice;

// The `Z.State` type provides an implementation of a
// [Harel Statechart](http://en.wikipedia.org/wiki/State_diagram#Harel_statechart).
//
// Statecharts are an improvement over state machines because they elegantly
// solve the state explosion problem that is common with state machines. They do
// this by adding two additional features to state machines - state clustering
// and concurrent states. State clustering provides an abstraction over lower
// level states where actions can be handled and transitions made in one place
// instead of many. Concurrent states essentially allow multiple statecharts to
// operate independently. The presence of concurrent states means that the
// current state of a statechart is actually a vector of states whose length is
// not fixed.
//
// More information on statecharts is available here:
//
// * http://www.wisdom.weizmann.ac.il/~harel/papers/Statecharts.pdf
// * http://www.wisdom.weizmann.ac.il/~harel/papers/Statecharts.History.pdf
// * http://www.amazon.com/Constructing-User-Interface-Statecharts-Horrocks/dp/0201342782
//
// Examples
//
//   var door = Z.State.define(function() {
//     this.state('closed', function() {
//       this.state('locked', function() {
//         this.def('unlockDoor', function() { this.goto('../unlocked'); });
//       });
//
//       this.state('unlocked', function() {
//         this.def('lockDoor', function() { this.goto('../locked'); });
//         this.def('openDoor', function() { this.goto('/opened'); });
//       });
//
//       this.def('knock', function() { console.log('*knock knock*'); });
//     });
//
//     this.state('opened', function() {
//       this.def('closeDoor', function() { this.goto('/closed/unlocked'); });
//     });
//   });
//
//   door.goto();
//   door.current();          // => [ '/closed/locked' ]
//   door.send('knock');      // *knock knock*
//   door.current();          // => [ '/closed/locked' ]
//   door.send('unlockDoor');
//   door.current();          // => [ '/closed/unlocked' ]
//   door.send('knock');      // *knock knock*
//   door.send('openDoor');
//   door.current();          // => [ '/opened' ]
//   door.send('closeDoor');
//   door.current();          // => [ '/closed/unlocked' ]
//   door.send('lockDoor');
//   door.current();          // => [ '/closed/locked' ]
Z.State = Z.Object.extend(Z.Enumerable, function() {
  // Internal: Calculates and caches the path from the root state to the
  // receiver state. Subsequent calls will return the cached path array.
  //
  // Returns an array of `Z.State` objects.
  function _path() {
    return this.__cache__._path = this.__cache__._path ||
      (this.superstate ? _path.call(this.superstate).concat(this) : [this]);
  }

  // Internal: Returns an array of all current leaf states.
  function _current() {
    var substates = this.substates.values();

    if (!this.isCurrent) { return []; }
    if (substates.size() === 0) { return [this]; }

    return substates.inject([], function(acc, s) {
      if (s.isCurrent) { acc = acc.concat(_current.call(s)); }
      return acc;
    });
  }

  // Internal: Resolves a string path into an actual `Z.State` object. Paths not
  // starting with a '/' are resolved relative to the receiver state, paths that
  // do start with a '/' are resolved relative to the root state.
  //
  // path      - A string containing the path to resolve or an array of path
  //             segments.
  // origPath  - A string containing the original path that we're attempting to
  //             resolve. Multiple recursive calls are made to this method so we
  //             need to pass along the original string path for error messages
  //             in the case where the path cannot be resolved.
  // origState - The state where path resolution was originally attempted from.
  //
  // Returns the `Z.State` object the path represents.
  // Throws `Error` if the path cannot be resolved.
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

  // Internal: Finds the pivot state between the receiver and the given state.
  // The pivot state is the first common ancestor between the two states.
  //
  // Returns a `Z.State` object.
  // Throws `Error` if the two states do not belong to the same statechart.
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

  // Internal: Queues up a transition for later processing. Transitions are
  // queued instead of happening immediately because we need to allow all
  // current states to receive an action before any transitions actually occur.
  //
  // pivot  - The pivot state between the start state and destination states.
  // states - An array of destination states.
  // opts   - The options object passed to the `goto` method.
  //
  // Returns nothing.
  function queueTransition(pivot, states, opts) {
    (this.__transitions__ = this.__transitions__ || []).push({
      pivot: pivot, states: states, opts: opts});
  }

  // Internal: Performs all queued transitions. This is the method that actually
  // takes the statechart from one set of current states to another.
  function transition() {
    var ts = this.__transitions__, i, len;

    if (!ts || ts.length === 0) { return; }

    this.willChangeProperty('current');

    for (i = 0, len = ts.length; i < len; i++) {
      enter.call(ts[i].pivot, ts[i].states, ts[i].opts);
    }

    this.didChangeProperty('current');

    this.__transitions__ = [];
  }

  // Internal: Enters a clustered state. Entering a clustered state involves
  // exiting the current substate (if one exists and is not a destination
  // state), invoking the `enter` method on the receiver state, and recursively
  // calling entering the new destination substate. The new destination substate
  // is determined as follows:
  //
  // 1. the substate indicated in the `states` argument if its not empty
  // 2. the result of invoking the condition function defined with the `C`
  //    method if it exists
  // 3. the most recently exited substate if the state was defined with the
  //    `hasHistory` option and has been previously entered
  // 4. the first substate
  //
  // states - A `Z.Array` of destination states (may be empty to indicate that
  //          a condition, history, or default substate should be entered).
  // opts   - The options passed to `goto`.
  //
  // Returns the receiver.
  // Throws an `Error` if the given destination states include multiple
  //   substates.
  function enterClustered(states, opts) {
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
        return enterClustered.call(this, states, opts);
      }
      else if (this.hasHistory) {
        next = this.__previous__ || this.substates.first()[1];
      }
      else {
        next = this.substates.first()[1];
      }
    }

    if (cur && cur !== next) { exit.call(cur, opts); }

    if (!this.isCurrent || opts.force) {
      if (root.trace && this !== root) {
        console.log(Z.fmt("Z.State: entering state '%@'%@", this.path(),
                          this.isCurrent ? ' (forced)' : ''));
      }

      this.isCurrent = true;
      if (this.respondTo('enter')) { this.enter(opts.context); }
    }

    if (next) { enter.call(next, states, opts); }

    return this;
  }

  // Internal: Enters a concurrent state. Entering a concurrent state simply
  // involves calling the `enter` method on the receiver and recursively
  // entering each substate.
  //
  // states - A `Z.Array` of destination states.
  // opts   - The options passed to `goto`.
  //
  // Returns the receiver.
  function enterConcurrent(states, opts) {
    var self = this, root = this.root();

    if (!this.isCurrent || opts.force) {
      if (root.trace && this !== root) {
        console.log(Z.fmt("Z.State: entering state '%@'%@", this.path(),
                         this.isCurrent ? ' (forced)' : ''));
      }

      this.isCurrent = true;
      if (this.respondTo('enter')) { this.enter(opts.context); }
    }

    this.substates.each(function(tuple) {
      enter.call(tuple[1],
        states.select(function(s) {
          return findPivot.call(tuple[1], s) === tuple[1];
        }), opts);
    });

    return this;
  }

  // Internal: Enters the receiver state. The actual entering logic is in the
  // `enterClustered` and `enterConcurrent` methods.
  //
  // states - A `Z.Array` of destination states.
  // opts   - The options passed to `goto`.
  //
  // Returns the receiver.
  function enter(states, opts) {
    return this.isConcurrent ?
      enterConcurrent.call(this, states, opts) :
      enterClustered.call(this, states, opts);
  }

  // Internal: Exits a clustered state. Exiting happens bottom to top, so we
  // recursively exit the current substate and then invoke the `exit` method on
  // each state as the stack unwinds.
  //
  // opts - The options passed to `goto`.
  //
  // Returns the receiver.
  function exitClustered(opts) {
    var root = this.root(), cur = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (this.hasHistory) { this.__previous__ = cur; }

    if (cur) { exit.call(cur, opts); }

    if (this.respondTo('exit')) { this.exit(opts.context); }
    this.isCurrent = false;

    if (root.trace && this !== root) {
      console.log(Z.fmt("Z.State: exiting state '%@'", this.path()));
    }

    return this;
  }

  // Internal: Exits a concurrent state. Similiar to `exitConcurrent` we
  // recursively exit each substate and invoke the `exit` method as the stack
  // unwinds.
  //
  // opts - The options passed to `goto`.
  //
  // Returnst he receiver.
  function exitConcurrent(opts) {
    var root = this.root();

    this.substates.values().each(function(s) { exit.call(s, opts); });
    if (this.respondTo('exit')) { this.exit(opts.context); }
    this.isCurrent = false;

    if (root.trace && this !== root) {
      console.log(Z.fmt("Z.State: exiting state '%@'", this.path()));
    }

    return this;
  }

  // Internal: Exits the receiver state. The actual exiting logic is in the
  // `exitClustered` and `exitConcurrent` methods.
  //
  // states - A `Z.Array` of destination states.
  // opts   - The options passed to `goto`.
  //
  // Returns the receiver.
  function exit(opts) {
    return this.isConcurrent ?
      exitConcurrent.call(this, opts) : exitClustered.call(this, opts);
  }

  // Internal: Sends an action to a clustered state.
  //
  // Returns a boolean indicating whether or not the action was handled by the
  //   current substate.
  function sendClustered() {
    var handled = false, cur;

    cur = this.substates.values().find(function(s) { return s.isCurrent; });

    if (cur) { handled = !!cur.send.apply(cur, slice.call(arguments)); }

    return handled;
  }

  // Internal: Sends an action to a concurrent state.
  //
  // Returns a boolean indicating whether or not the action was handled by all
  //   substates.
  function sendConcurrent() {
    var args = slice.call(arguments),handled = true;

    this.substates.values().each(function(s) {
      handled = !!s.send.apply(s, args) && handled;
    });

    return handled;
  }

  // Public: Convenience method for creating a new statechart. Simply creates a
  // root state and invokes the given function in the context of that state.
  //
  // opts - An object of options to pass the to `Z.State` constructor (default:
  //        `null`).
  // f    - A function object to invoke in the context of the newly created root
  //        state (default: `null`).
  //
  // Examples
  //
  //   var sc = Z.State.define({isConcurrent: true}, function() {
  //     this.state('a');
  //     this.state('b');
  //     this.state('c');
  //   });
  //
  // Returns the newly created root state.
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

    if (Z.isA(name, Z.State)) {
      s = name;
      this.addSubstate(s);
    }
    else {
      s = Z.State.create(name, opts);
      this.addSubstate(s);
      if (f) { f.call(s); }
    }

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

  this.prop('current', {
    readonly: true,
    get: function() {
      var states = _current.call(this), paths = [], i, len;

      for (i = 0, len = states.length; i < len; i++) {
        paths.push(states[i].path());
      }

      return paths;
    }
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

  this.def('goto', function() {
    var self   = this,
        root   = this.root(),
        paths  = Z.Array.create(arguments).flatten(),
        opts   = Z.isObject(paths.last()) ? paths.pop() : {},
        states = paths.map(function(p) { return resolve.call(self, p); }),
        pivots = states.map(function(s) { return findPivot.call(self, s); }),
        pivot  = pivots.first() || this;

    if (root.trace) {
      console.log(Z.fmt("Z.State: transitioning to states %@", Z.inspect(paths.toNative())));
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

    queueTransition.call(root, pivot, states, opts);

    if (!this.__isSending__) { transition.call(root); }

    return this;
  });

  this.def('send', function() {
    var args = slice.call(arguments), handled;

    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.send: attempted to send an action to a state that is not current: %@", this));
    }

    handled = this.isConcurrent ? sendConcurrent.apply(this, arguments) :
      sendClustered.apply(this, arguments);

    if (!handled && this.respondTo(args[0])) {
      this.__isSending__ = true;
      handled = !!this[args[0]].apply(this, args.slice(1));
      this.__isSending__ = false;
    }

    if (!this.superstate) { transition.call(this); }

    return handled;
  });
});

}());

