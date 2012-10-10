(function() {

var slice = Array.prototype.slice;

if (!this.Z) { require('./helper'); }

describe('Z.State.init', function() {
  it('should set the `name` property', function() {
    var s = Z.State.create('a');
    expect(s.name).toBe('a');
  });

  it('should set the `substates` property to an empty hash', function() {
    var s = Z.State.create('a');
    expect(s.substates).toEq(Z.H());
  });

  it('should set `isCurrent` to `false`', function() {
    var s = Z.State.create('a');
    expect(s.isCurrent).toBe(false);
  });

  it('should default `isConcurrent` to `false`', function() {
    var s = Z.State.create('a');
    expect(s.isConcurrent).toBe(false);
  });

  it('should allow setting `isConcurrent` to `true`', function() {
    var s = Z.State.create('a', {isConcurrent: true});
    expect(s.isConcurrent).toBe(true);
  });

  it('should default `hasHistory` to `false`', function() {
    var s = Z.State.create('a');
    expect(s.hasHistory).toBe(false);
  });

  it('should allow setting `hasHistory` to `true`', function() {
    var s = Z.State.create('a', {hasHistory: true});
    expect(s.hasHistory).toBe(true);
  });

  it('should raise an exception if `isConcurrent` and `hasHistory` are set', function() {
    expect(function() {
      Z.State.create('a', {isConcurrent: true, hasHistory: true});
    }).toThrow('Z.State.init: history states are not allowed on concurrent states');
  });
});

describe('Z.State.addSubstate', function() {
  it('should add the given state to the substates hash', function() {
    var a = Z.State.create('a'),
        b = Z.State.create('b'),
        c = Z.State.create('c');

    a.addSubstate(b);
    expect(a.substates).toEq(Z.H('b', b));
    a.addSubstate(c);
    expect(a.substates).toEq(Z.H('b', b, 'c', c));
  });

  it('should set the superstate property of the given state', function() {
    var a = Z.State.create('a'),
        b = Z.State.create('b'),
        c = Z.State.create('c');

    a.addSubstate(b);
    expect(b.superstate).toBe(a);
    a.addSubstate(c);
    expect(c.superstate).toBe(a);
  });
});

describe('Z.State.each', function() {
  it("should yield each state in the receiver's hierarchy", function() {
    var a    = Z.State.create('a'),
        b    = Z.State.create('b'),
        c    = Z.State.create('c'),
        d    = Z.State.create('d'),
        e    = Z.State.create('e'),
        f    = Z.State.create('f'),
        g    = Z.State.create('g'),
        test = [];

    a.addSubstate(b);
    a.addSubstate(c);
    a.addSubstate(d);
    b.addSubstate(e);
    b.addSubstate(f);
    f.addSubstate(g);

    a.each(function(s) { test.push(s); });

    expect(test).toEq([a, b, e, f, g, c, d]);
  });
});

describe('Z.State.root', function() {
  it('should return the root of the tree', function() {
    var a = Z.State.create('a'),
        b = Z.State.create('b'),
        c = Z.State.create('c');
        d = Z.State.create('d');

    a.addSubstate(b);
    a.addSubstate(c);
    c.addSubstate(d);
    expect(a.root()).toEq(a);
    expect(b.root()).toEq(a);
    expect(c.root()).toEq(a);
    expect(d.root()).toEq(a);
  });
});

describe('Z.State.path', function() {
  it('should return a string of "/" separated state names leading up to the root state', function() {
    var a = Z.State.create('a'),
        b = Z.State.create('b'),
        c = Z.State.create('c'),
        d = Z.State.create('d');

    expect(a.path()).toEq('/');
    expect(b.path()).toEq('/');
    expect(c.path()).toEq('/');
    expect(d.path()).toEq('/');

    b.addSubstate(c);
    b.addSubstate(d);

    expect(a.path()).toEq('/');
    expect(b.path()).toEq('/');
    expect(c.path()).toEq('/c');
    expect(d.path()).toEq('/d');

    a.addSubstate(b);

    expect(a.path()).toEq('/');
    expect(b.path()).toEq('/b');
    expect(c.path()).toEq('/b/c');
    expect(d.path()).toEq('/b/d');
  });
});

describe('Z.State.current', function() {
  var root, s, s1, s2, s11, s12, s21, s22;

  beforeEach(function() {
    root = Z.State.create('root');
    s    = Z.State.create('s', {isConcurrent: true});
    s1   = Z.State.create('s1');
    s2   = Z.State.create('s2');
    s11  = Z.State.create('s11');
    s12  = Z.State.create('s12');
    s21  = Z.State.create('s21');
    s22  = Z.State.create('s22');

    root.addSubstate(s);
    s.addSubstate(s1);
    s.addSubstate(s2);
    s1.addSubstate(s11);
    s1.addSubstate(s12);
    s2.addSubstate(s21);
    s2.addSubstate(s22);

    root.goto();
  });

  it('should return an empty array when the state is not current', function() {
    expect(s12.isCurrent).toBe(false);
    expect(s12.current()).toEq([]);
  });

  it('should return an array of all current leaf state paths', function() {
    root.goto('/s/s1/s11', '/s/s2/s22');
    expect(s.current()).toEq(['/s/s1/s11', '/s/s2/s22']);
  });
});

describe('Z.State.goto', function() {
  var enters, exits, root, a, b, c, d, e, f, g, h, i, j, k, l, m;

  beforeEach(function() {
    enters = [];
    exits  = [];

    root = Z.State.create('root');
    a    = Z.State.create('a');
    b    = Z.State.create('b', {hasHistory: true});
    c    = Z.State.create('c');
    d    = Z.State.create('d');
    e    = Z.State.create('e');
    f    = Z.State.create('f');
    g    = Z.State.create('g', {isConcurrent: true});
    h    = Z.State.create('h');
    i    = Z.State.create('i');
    j    = Z.State.create('j');
    k    = Z.State.create('k');
    l    = Z.State.create('l');
    m    = Z.State.create('m');

    root.addSubstate(a);
    a.addSubstate(b);
    a.addSubstate(e);
    b.addSubstate(c);
    b.addSubstate(d);
    e.addSubstate(f);
    e.addSubstate(g);
    g.addSubstate(h);
    g.addSubstate(k);
    h.addSubstate(i);
    h.addSubstate(j);
    k.addSubstate(l);
    k.addSubstate(m);

    root.goto();

    Z.A(root, a, b, c, d, e, f, g, h, i, j, k, l, m).each(function(s) {
      s.def('enter', function() { enters.push(this); });
      s.def('exit', function() { exits.push(this); });
    });
  });

  describe('on the root state', function() {
    it('should transition to all default states when no paths are given', function() {
      expect(root.current()).toEq(['/a/b/c']);
    });

    it('should transition all current states to the given states', function() {
      root.goto('/a/e/g/h/j', '/a/e/g/k/l');
      expect(root.current()).toEq(['/a/e/g/h/j', '/a/e/g/k/l']);
      root.goto('/a/b/d');
      expect(root.current()).toEq(['/a/b/d']);
    });
  });

  it('should raise an exception when the receiver state is not current', function() {
    expect(function() {
      d.goto('/a/e/f');
    }).toThrow(Z.fmt("Z.State.goto: state %@ is not current", d));
  });

  it('should raise an exception when multiple pivot states are found between the receiver and the given destination paths', function() {
    expect(function() {
      c.goto('/a/b/d', '/a/e/f');
    }).toThrow(Z.fmt("Z.State.goto: multiple pivot states found between state %@ and paths /a/b/d, /a/e/f", c));
  });

  it('should raise an exception if any given destination state is not reachable from the receiver', function() {
    root.goto('/a/e/g/h/i');
    expect(function() {
      i.goto('/a/e/g/k/l');
    }).toThrow(Z.fmt("Z.State.goto: one or more of the given paths are not reachable from state %@: /a/e/g/k/l", i));
  });

  it('should raise an exception when given an invalid path', function() {
    expect(function() {
      c.goto('/a/b/x');
    }).toThrow(Z.fmt("Z.State.resolve: could not resolve path '/a/b/x' from state %@", c));
  });

  it('should raise an exception when given paths to multiple clustered states', function() {
    expect(function() {
      c.goto('/a/e/f', '/a/e/g');
    }).toThrow(Z.fmt("Z.State.enterClustered: attempted to enter multiple substates of %@: f, g", e));
  });

  it('should handle directory-like relative paths', function() {
    expect(root.current()).toEq(['/a/b/c']);
    c.goto('../d');
    expect(root.current()).toEq(['/a/b/d']);
    d.goto('../../e/f');
    expect(root.current()).toEq(['/a/e/f']);
    f.goto('./../../b/./d/../c');
    expect(root.current()).toEq(['/a/b/c']);
    c.goto('../../e/g/h/j/../i', '../../e/g/k');
    expect(root.current()).toEq(['/a/e/g/h/i', '/a/e/g/k/l']);
  });

  it('should exit the states leading up to the pivot state and enter the states leading to the destination states', function() {
    c.goto('/a/e/f');
    expect(exits).toEq([c, b]);
    expect(enters).toEq([e, f]);

    exits  = [];
    enters = [];

    f.goto('/a/e/g/h/i', '/a/e/g/k/m');
    expect(exits).toEq([f]);
    expect(enters).toEq([g, h, i, k, m]);
  });

  it('should set `isCurrent` to `true` on all states entered and to `false` on all states exited', function() {
    expect(a.isCurrent).toBe(true);
    expect(b.isCurrent).toBe(true);
    expect(c.isCurrent).toBe(true);
    expect(e.isCurrent).toBe(false);
    expect(f.isCurrent).toBe(false);

    c.goto('/a/e/f');

    expect(a.isCurrent).toBe(true);
    expect(b.isCurrent).toBe(false);
    expect(c.isCurrent).toBe(false);
    expect(e.isCurrent).toBe(true);
    expect(f.isCurrent).toBe(true);
  });

  it('should enter the default substate when a path to a leaf state is not given', function() {
    c.goto('/a/e/g');
    expect(enters).toEq([e, g, h, i, k, l]);
  });

  it('should exit all substates when a concurrent superstate is exited', function() {
    c.goto('/a/e/g/h/j', '/a/e/g/k/l');

    exits  = [];
    enters = [];

    g.goto('/a/b/d');

    expect(exits).toEq([j, h, l, k, g, e]);
  });

  it('should enter all substates when concurrent superstate is entered', function() {
    c.goto('/a/e/g')
    expect(enters).toEq([e, g, h, i, k, l]);
  });

  it('should not affect the states in concurrent superstates', function() {
    c.goto('/a/e/g/h/j', '/a/e/g/k/m');

    exits  = [];
    enters = [];

    m.goto('/a/e/g/k/l');
    expect(exits).toEq([m]);
    expect(enters).toEq([l]);
  });

  it('should enter the most recently exited substate when the path is not specified and the state has history tracking', function() {
    expect(root.current()).toEq(['/a/b/c']);
    c.goto('/a/b/d');
    expect(root.current()).toEq(['/a/b/d']);
    d.goto('/a/e/f');
    expect(root.current()).toEq(['/a/e/f']);
    f.goto('/a/b');
    expect(root.current()).toEq(['/a/b/d']);
  });

  it("should pass along its `context` option to each entered state's `enter` method", function() {
    var ectx, fctx;

    e.def('enter', function(ctx) { ectx = ctx; });
    f.def('enter', function(ctx) { fctx = ctx; });

    c.goto('/a/e/f', {context: 'foo'});

    expect(ectx).toEq('foo');
    expect(fctx).toEq('foo');
  });

  it("should pass along its `context` option to each exited state's `exit` method", function() {
    var bctx, cctx;

    b.def('exit', function(ctx) { bctx = ctx; });
    c.def('exit', function(ctx) { cctx = ctx; });

    c.goto('/a/e/f', {context: 'bar'});

    expect(bctx).toEq('bar');
    expect(cctx).toEq('bar');
  });
});

describe('Z.State condition states', function() {
  var root, a, b, c, d;

  beforeEach(function() {
    root = Z.State.create('root');
    x    = Z.State.create('x');
    a    = Z.State.create('a');
    b    = Z.State.create('b');
    c    = Z.State.create('c', {isConcurrent: true});
    d    = Z.State.create('d');
    e    = Z.State.create('e');
    f    = Z.State.create('f');
    g    = Z.State.create('g');
    h    = Z.State.create('h');
    i    = Z.State.create('i');

    root.addSubstate(x);
    root.addSubstate(a);
    a.addSubstate(b);
    a.addSubstate(c);
    c.addSubstate(d);
    c.addSubstate(e);
    d.addSubstate(f);
    d.addSubstate(g);
    e.addSubstate(h);
    e.addSubstate(i);

    root.goto();
    expect(root.current()).toEq(['/x']);
  });

  it('should throw an exception when a condition state is defined on a state with history', function() {
    var s = Z.State.create('x', {hasHistory: true});

    expect(function() {
      s.C(function() {});
    }).toThrow(Z.fmt("Z.State.C: a state may not have both condition and history states: %@", s));
  });

  it('should throw an exception when a condition state is defined on concurrent state', function() {
    var s = Z.State.create('x', {isConcurrent: true});

    expect(function() {
      s.C(function() {});
    }).toThrow(Z.fmt("Z.State.C: a concurrent state may not have a condition state: %@", s));
  });

  it('should cause goto to enter the the state returned by the condition function', function() {
    a.C(function() { return './b'; });
    root.goto('/a');
    expect(root.current()).toEq(['/a/b']);
  });

  it('should cause goto to enter the states returned by the condition function', function() {
    a.C(function() { return ['./c/d/g', '/a/c/e/i']; });
    root.goto('/a');
    expect(root.current()).toEq(['/a/c/d/g', '/a/c/e/i']);
  });

  it('should not be called when destination states are given', function() {
    var called = false;

    a.C(function() { called = true; return ['./c/d/g', './c/e/h'] });
    root.goto('/a/b');

    expect(called).toBe(false);
    expect(root.current()).toEq(['/a/b']);
  });
});

describe('Z.State.define', function() {
  it('should create a root state with the name "__root__"', function() {
    var s = Z.State.define(function() {});
    expect(s.superstate).toBeNull();
    expect(s.name).toBe('__root__');
  });

  it('should pass the options to the `Z.State` constructor', function() {
    var s = Z.State.define({isConcurrent: true}, function() {});
    expect(s.isConcurrent).toBe(true);
  });

  it('should call the given function in the context of the newly created state', function() {
    var context, s = Z.State.define(function() { context = this; });
    expect(context).toBe(s);
  });
});

describe('Z.State.state', function() {
  var root;

  beforeEach(function() { root = Z.State.define(); });

  it('should create a substate with the given name on the receiver', function() {
    var x = root.state('x');
    expect(x.isA(Z.State)).toBe(true);
    expect(root.substates.size()).toBe(1);
    expect(root.substates.at('x')).toBe(x);
  });

  it('should pass the options to the `Z.State` constructor', function() {
    var x = root.state('x', {isConcurrent: true});
    expect(x.isConcurrent).toBe(true);
  });

  it('should call the given function in the context of the newly created state', function() {
    var context, x = root.state('x', function() { context = this; });
    expect(context).toBe(x);
  });
});

describe('Z.State.send', function() {
  var calls, root, a, b, c, d, e, f;

  beforeEach(function() {
    calls = Z.A();
    root  = Z.State.create('root', {isConcurrent: true});
    a     = Z.State.create('a');
    b     = Z.State.create('b');
    c     = Z.State.create('c');
    d     = Z.State.create('d');
    e     = Z.State.create('e');
    f     = Z.State.create('f');

    root.addSubstate(a);
    a.addSubstate(b);
    a.addSubstate(c);
    root.addSubstate(d);
    d.addSubstate(e);
    d.addSubstate(f);

    root.def('someAction', function() { calls.push(this); });
    a.def('someAction', function() { calls.push(this); });
    b.def('someAction', function() { calls.push(this); });
    c.def('someAction', function() { calls.push(this); });
    d.def('someAction', function() { calls.push(this); });
    e.def('someAction', function() { calls.push(this); });
    f.def('someAction', function() { calls.push(this); });

    root.goto();
    expect(root.current()).toEq(['/a/b', '/d/e']);
  });

  it('should send the action to all current states', function() {
    root.send('someAction');
    expect(calls.contains(root)).toBe(true);
    expect(calls.contains(a)).toBe(true);
    expect(calls.contains(b)).toBe(true);
    expect(calls.contains(d)).toBe(true);
    expect(calls.contains(e)).toBe(true);
  });

  it('should pass additional arguments to the action handler', function() {
    var bArgs;

    b.def('someAction', function() { bArgs = slice.call(arguments); });

    root.send('someAction', 1, 2, 'foo');
    expect(bArgs).toEq([1, 2, 'foo']);
  });

  it("should bubble the action up each current state's superstate chain", function() {
    root.send('someAction');
    expect(calls).toEq(Z.A(b, a, e, d, root));
  });

  it('should not perform transitions made in an action handler until all current states have received the action', function() {
    var eCurrent;

    b.def('someAction', function() { this.goto('/a/c'); });
    e.def('someAction', function() { eCurrent = root.current(); });

    root.send('someAction');

    expect(root.current()).toEq(['/a/c', '/d/e']);
    expect(eCurrent).toEq(['/a/b', '/d/e']);
  });
});

}());

