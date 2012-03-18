(function() {

var Z = this.Z || require('zoom');

describe('Z.hash', function() {
  describe('with `null` or `undefined`', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(undefined)).toBe('number');
      expect(typeof Z.hash(null)).toBe('number');
    });

    it('should always return the same value', function() {
      expect(Z.hash(undefined)).toBe(Z.hash(undefined));
      expect(Z.hash(null)).toBe(Z.hash(null));
      expect(Z.hash(null)).not.toBe(Z.hash(undefined));
    });
  });

  describe('with a native array', function() {
    it('should return a number', function() {
      expect(typeof Z.hash([])).toBe('number');
      expect(typeof Z.hash([1,2,'three'])).toBe('number');
    });

    it('should return the same value when the arrays are equivalent', function() {
      expect(Z.hash([])).toBe(Z.hash([]));
      expect(Z.hash(['x'])).toBe(Z.hash(['x']));
      expect(Z.hash([1,2,'three'])).toBe(Z.hash([1,2,'three']));
    });

    it('should return different values for arrays with the same items but in different orders', function() {
      expect(Z.hash([1,2])).not.toBe(Z.hash([2,1]));
      expect(Z.hash(['one', 'two', 3])).not.toBe(Z.hash(['two', 3, 1]));
    });

    it('should generate a value for recursive arrays', function() {
      var a = [], b = [1, 'two', 3.0];
      a.push(a);
      b.push(b, b, b, b, b);

      expect(typeof Z.hash(a)).toBe('number');
      expect(typeof Z.hash(b)).toBe('number');
    });

    it('should return the same value for equal recursive arrays', function() {
      var a = [];
      a.push(a);

      expect(Z.hash(a)).toBe(Z.hash([a]));
      expect(Z.hash(a)).toBe(Z.hash([[a]]));
    });

    it('should return the same value for equal recursive arrays through plain objects', function() {
      var o = {}, a = [o];
      o.x = a;

      expect(Z.hash(a)).toBe(Z.hash([o]));
      expect(Z.hash(a)).toBe(Z.hash([{x: a}]));
    });
  });

  describe('with an Arguments object', function() {
    it('should return the same value as the equivalent native array', function() {
      var args = (function() { return arguments; }(1,2,3));
      expect(Z.hash(args)).toEq(Z.hash([1,2,3]));
    });
  });

  describe('with a function', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(function() {})).toBe('number');
    });

    it('should return the same value when the functions are the same and different otherwise', function() {
      var f1 = function(a) { return a + 1; },
          f2 = function(a) { return a + 1; },
          f3 = function(a) { return a + 2; };

      expect(Z.hash(f1)).toBe(Z.hash(f1));
      expect(Z.hash(f1)).toBe(Z.hash(f2));
      expect(Z.hash(f1)).not.toBe(Z.hash(f3));
      expect(Z.hash(f2)).not.toBe(Z.hash(f3));
    });
  });

  describe('with a string', function() {
    it('should return a number', function() {
      expect(typeof Z.hash('')).toBe('number');
      expect(typeof Z.hash('bar')).toBe('number');
    });

    it('should always return the same value when given the same string', function() {
      expect(Z.hash('')).toBe(Z.hash(''));
      expect(Z.hash('foobar')).toBe(Z.hash('foobar'));
    });

    it('should return different values for different strings', function() {
      expect(Z.hash('')).not.toBe(Z.hash('x'));
      expect(Z.hash('foo')).not.toBe(Z.hash('bar'));
      expect(Z.hash('foo')).not.toBe(Z.hash('Foo'));
      expect(Z.hash(' foo')).not.toBe(Z.hash('oo'));
      expect(Z.hash('  ')).not.toBe(Z.hash(' '));
    });
  });

  describe('with a number', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(1)).toBe('number');
      expect(typeof Z.hash(3.14)).toBe('number');
      expect(typeof Z.hash(NaN)).toBe('number');
    });

    it('should always return the same value when given the same number', function() {
      expect(Z.hash(1)).toBe(Z.hash(1));
      expect(Z.hash(3.14)).toBe(Z.hash(3.14));
      expect(Z.hash(NaN)).toBe(Z.hash(NaN));
      expect(Z.hash(1)).toBe(Z.hash(1.0));
    });

    it('should return different values for different numbers', function() {
      expect(Z.hash(1)).not.toBe(Z.hash(2));
      expect(Z.hash(3.14)).not.toBe(Z.hash(3.141));
    });
  });

  describe('with a boolean', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(true)).toBe('number');
      expect(typeof Z.hash(false)).toBe('number');
    });

    it('should always return the same value when given the same boolean', function() {
      expect(Z.hash(true)).toBe(Z.hash(true));
      expect(Z.hash(false)).toBe(Z.hash(false));
    });

    it('should return different values for different booleans', function() {
      expect(Z.hash(true)).not.toBe(Z.hash(false));
    });
  });

  describe('with a Date', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(new Date())).toBe('number');
    });

    it('should always return the same value when given equal dates', function() {
      expect(Z.hash(new Date(2012, 0, 28))).toBe(Z.hash(new Date(2012, 0, 28)));
      expect(Z.hash(new Date(2012, 0, 28, 8, 26, 0, 0))).toBe(Z.hash(new Date(2012, 0, 28, 8, 26, 0, 0)));
    });

    it('should return different values for different dates', function() {
      var d1 = new Date(2012, 0, 28),
          d2 = new Date(2012, 0, 29),
          d3 = new Date(2012, 1, 2, 6, 36, 0, 0),
          d4 = new Date(2012, 1, 2, 6, 36, 0, 1);

      expect(Z.hash(d1)).not.toBe(Z.hash(d2));
      expect(Z.hash(d3)).not.toBe(Z.hash(d4));
    });
  });

  describe('with a RegExp', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(/x/)).toBe('number');
      expect(typeof Z.hash(new RegExp('foo'))).toBe('number');
    });

    it('should always return the same value when given equal regexps', function() {
      expect(Z.hash(/x.z/)).toBe(Z.hash(/x.z/));
      expect(Z.hash(new RegExp('x.z'))).toBe(Z.hash(new RegExp('x.z')));
      expect(Z.hash(/x.z/)).toBe(Z.hash(new RegExp('x.z')));
      expect(Z.hash(/x.z/im)).toBe(Z.hash(/x.z/im));
      expect(Z.hash(/x.z/mi)).toBe(Z.hash(/x.z/im));
      expect(Z.hash(/x.z/mi)).toBe(Z.hash(new RegExp('x.z', 'im')));
    });

    it('should return different values when for different regexps', function() {
      expect(Z.hash(/x.z/)).not.toBe(Z.hash(/x*z/));
      expect(Z.hash(new RegExp('x*z'))).not.toBe(Z.hash(new RegExp('x.z')));
      expect(Z.hash(/x.zy/)).not.toBe(Z.hash(new RegExp('x.z')));
      expect(Z.hash(/x.z/i)).not.toBe(Z.hash(/x.z/im));
      expect(Z.hash(/x.z/ig)).not.toBe(Z.hash(new RegExp('x.z', 'g')));
    });
  });

  describe('with a plain object', function() {
    it('should return a number', function() {
      expect(typeof Z.hash({})).toBe('number');
      expect(typeof Z.hash({foo: 1, bar: 2})).toBe('number');
    });

    it('should return the same value when the objects are equivalent', function() {
      expect(Z.hash({})).toBe(Z.hash({}));
      expect(Z.hash({foo: 1})).toBe(Z.hash({foo: 1}));
      expect(Z.hash({foo: 1, bar: 2})).toBe(Z.hash({foo: 1, bar: 2}));
    });

    it("should return a value that doesn't depend on the order of the keys", function() {
      expect(Z.hash({foo: 1, bar: 2})).toBe(Z.hash({bar: 2, foo: 1}));
      expect(Z.hash({foo: ['a', 'b'], bar: 3})).toBe(Z.hash({bar: 3, foo: ['a', 'b']}));
    });

    it('should generate a value for recursive objects', function() {
      var o = {};
      o.x = o;

      expect(Z.hash(o)).toBe(Z.hash(o.x));
    });

    it('should return the same value for equal recursive objects', function() {
      var o = {};
      o.x = o;

      expect(Z.hash(o)).toBe(Z.hash({x: o}));
      expect(Z.hash(o)).toBe(Z.hash({x: {x: o}}));
    });

    it('should return the same value for recursive objects through arrays', function() {
      var o = {}, rec = [o];
      o.x = rec;

      expect(Z.hash(o)).toBe(Z.hash({x: rec}));
      expect(Z.hash(o)).toBe(Z.hash({x: [o]}));
    });
  });

  describe('with a Z.Object', function() {
    it("should invoke the object's `hash` method", function() {
      var o = Z.Object.create();
      spyOn(o, 'hash');
      Z.hash(o);
      expect(o.hash).toHaveBeenCalled();
    });
  });
});

describe('Z.Hash constructor', function() {
  describe('with no arguments', function() {
    it('should create a hash of size 0', function() {
      expect(Z.Hash.create().size()).toBe(0);
    });
  });

  describe('with one non-function argument', function() {
    it('should create a hash of size 0 and use the given value as the default value', function() {
      var h = Z.Hash.create(9);

      expect(h.size()).toBe(0);
      expect(h.at('somekey')).toBe(9);
    });
  });

  describe('with one function argument', function() {
    it('should create a hash of size 0 and invoke the given function when trying to get an unknown key', function() {
      var h = Z.Hash.create(function(h, k) { return h.at(k, k); });

      expect(h.size()).toBe(0);
      expect(h.at('x')).toBe('x');
      expect(h.size()).toBe(1);
      expect(h.at('y')).toBe('y');
      expect(h.size()).toBe(2);
      expect(h.at('x')).toBe('x');
      expect(h.size()).toBe(2);
    });
  });

  describe('with more than one argument', function() {
    it('should throw an exception', function() {
      expect(function() {
        Z.Hash.create(1,2,3);
      }).toThrow('Z.Hash.initialize: given 3 arguments, expected 0 or 1');
    });
  });
});

describe('Z.H', function() {
  describe('with a plain object', function() {
    it('should set each key/value pair in the object', function() {
      var h = Z.H({foo: 1, bar: 2, baz: 'stuff'});

      expect(Z.H().size()).toBe(0);
      expect(h.size()).toBe(3);
      expect(h.at('foo')).toBe(1);
      expect(h.at('bar')).toBe(2);
      expect(h.at('baz')).toBe('stuff');
    });
  });

  describe('with an even number of arguments', function() {
    it('should set each pair of objects as key/value pairs', function() {
      var h = Z.H(1, 'one', 2, 'two', {foo: 1}, {x: 'y'});

      expect(h.size()).toBe(3);
      expect(h.at(1)).toBe('one');
      expect(h.at(2)).toBe('two');
      expect(h.at({foo: 1})).toEq({x: 'y'});
    });
  });

  describe('with an odd number of arguments', function() {
    it('should throw an exception', function() {
      expect(function() {
        Z.H('blah');
      }).toThrow('Z.H: given 1 arguments, expected 1 plain object or an even number of arguments');

      expect(function() {
        Z.H(1,2,3);
      }).toThrow('Z.H: given 3 arguments, expected 1 plain object or an even number of arguments');
    });
  });
});

describe('Z.Hash.toString', function() {
  it('should return a string with the prototype name, object id, and hash contents', function() {
    var h = Z.H('foo', 1, [], 2), s = h.toString();

    expect(s).toMatch(new RegExp('^#<Z.Hash:' + h.objectId() + ' {'));
    expect(s).toMatch(/'foo': 1/);
    expect(s).toMatch(/\[\]: 2/);
  });

  it('should handle recursive hashes', function() {
    var h = Z.H();

    h.at('h', h);

    expect(h.toString()).toEq(Z.fmt("#<Z.Hash:%@ {'h': #<Z.Hash:%@ {...}>}>", h.objectId(), h.objectId()));
  });
});

describe('Z.Hash.at', function() {
  var h;

  beforeEach(function() { h = Z.H('foo', 1, 'bar', 2); });

  describe('with one argument', function() {
    it('should return the value for the given key', function() {
      expect(h.at('foo')).toBe(1);
      expect(h.at('bar')).toBe(2);
      expect(h.at('xyz')).toBe(null);
    });
  });

  describe('with two arguments', function() {
    it('should set the given value for the given key', function() {
      h.at('foo', 'abc');
      expect(h.at('foo')).toBe('abc');
      h.at(12, 'twelve');
      expect(h.at(12)).toBe('twelve');
    });

    it('should return the value', function() {
      expect(h.at('x', 'y')).toBe('y');
    });
  });

  describe('with zero or more than two arguments', function() {
    it('should throw an exception', function() {
      expect(function() {
        h.at();
      }).toThrow('Z.Hash.at: given 0 arguments, expected 1 or 2');

      expect(function() {
        h.at('foo', 'bar', 'baz');
      }).toThrow('Z.Hash.at: given 3 arguments, expected 1 or 2');
    });
  });
});

describe('Z.Hash.del', function() {
  var h;

  beforeEach(function() { h = Z.H('foo', 1, 'bar', 2); });

  it('should return the value of the given key', function() {
    expect(h.del('foo')).toBe(1);
    expect(h.del('xyz')).toBe(null);
  });

  it("should return null when the key doesn't exist", function() {
    var h2 = Z.Hash.create(9);

    expect(h.del('xyz')).toBe(null);
    expect(h2.del('foo')).toBe(null);
  });

  it('should remove the key/value pair from the hash', function() {
    expect(h.size()).toBe(2);
    h.del('foo');
    expect(h.size()).toBe(1);
    h.del('bar');
    expect(h.size()).toBe(0);
  });

  it('should not affect the size if the key is not in the hash', function() {
    expect(h.size()).toBe(2);
    h.del('blah');
    expect(h.size()).toBe(2);
  });

  it('should throw an exception if not given one argument', function() {
    expect(function() {
      h.del();
    }).toThrow('Z.Hash.del: given 0 arguments, expected 1');

    expect(function() {
      h.del('a', 'b', 'c');
    }).toThrow('Z.Hash.del: given 3 arguments, expected 1');
  });
});

describe('Z.Hash.hasKey', function() {
  var h = Z.H('foo', 1, /x/, 2, {}, 3, [1,2], 4);

  it('should return `false` if the given key is not in the hash', function() {
    expect(h.hasKey('bar')).toBe(false);
    expect(h.hasKey(/y/)).toBe(false);
    expect(h.hasKey(/x/i)).toBe(false);
    expect(h.hasKey({a: 1})).toBe(false);
    expect(h.hasKey([])).toBe(false);
    expect(h.hasKey([1])).toBe(false);
  });

  it('should return `true` if the given key is in the hash', function() {
    expect(h.hasKey('foo')).toBe(true);
    expect(h.hasKey(/x/)).toBe(true);
    expect(h.hasKey({})).toBe(true);
    expect(h.hasKey([1,2])).toBe(true);
  });

  it('throw an exception if not given one argument', function() {
    expect(function() {
      Z.H().hasKey();
    }).toThrow('Z.Hash.hasKey: given 0 arguments, expected 1');

    expect(function() {
      Z.H().hasKey(1, 2);
    }).toThrow('Z.Hash.hasKey: given 2 arguments, expected 1');
  });
});

describe('Z.Hash `size` property', function() {
  it('should return the current size of the hash', function() {
    expect(Z.H().size()).toBe(0);
    expect(Z.H('foo', 1, 'bar', 2, 'baz', 3).get('size')).toBe(3);
  });

  it('should update when key/value pairs are added or removed', function() {
    var h = Z.H('foo', 1, 'bar', 2, 'baz', 3);

    expect(h.size()).toBe(3);
    h.at('quux', 4);
    expect(h.size()).toBe(4);
    h.del('foo');
    expect(h.size()).toBe(3);
  });

  it('should be readonly', function() {
    var h = Z.H();

    expect(function() {
      h.size(18);
    }).toThrow('Z.Object.set: attempted to set readonly property `size` for ' + h.toString());
  });

  it('should notify observers when the size changes', function() {
    var h        = Z.H('foo', 1, 'bar', 2),
        observer = { notifications: [], action: function(n) { this.notifications.push(n); } };

    h.observe('size', observer, 'action', { previous: true, current: true });
    h.at('baz', 3);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].previous).toBe(2);
    expect(observer.notifications[0].current).toBe(3);
    h.at('baz', 4);
    expect(observer.notifications.length).toBe(1);
    h.del('foo');
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].previous).toBe(3);
    expect(observer.notifications[1].current).toBe(2);
  });
});

describe('Z.Hash.each', function() {
  it('should yield each key/value pair in the hash to the given function', function() {
    var h = Z.H('foo', 1, 'bar', 2, 'baz', 3), keys = [], values = [];

    h.each(function(k, v) { keys.push(k); values.push(v); });

    expect(keys.sort()).toEq(['bar', 'baz', 'foo']);
    expect(values.sort()).toEq([1, 2, 3]);
  });

  it('should maintain insertion order', function() {
    var h = Z.H('a', 1, 'b', 2, 'c', 3, 'd', 4, 'e', 5, 'f', 6, 'g', 7, 'h', 8),
        keys = [], values = [];

    h.each(function(k, v) { keys.push(k); values.push(v); });

    expect(keys).toEq(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(values).toEq([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('should maintain insertion order when key/value pairs are deleted', function() {
    var h = Z.H('a', 1, 'b', 2, 'c', 3, 'd', 4, 'e', 5, 'f', 6, 'g', 7, 'h', 8),
        keys = [], values = [];

    h.del('c');
    h.del('f');
    h.del('b');

    h.each(function(k, v) { keys.push(k); values.push(v); });

    expect(keys).toEq(['a', 'd', 'e', 'g', 'h']);
    expect(values).toEq([1, 4, 5, 7, 8]);
  });
});

describe('Z.Hash.keys', function() {
  it('should return a Z.Array containing all keys in the hash', function() {
    var h = Z.H('foo', 1, 'bar', 2, 'baz', 3), keys = h.keys();

    expect(keys.isZArray).toBe(true);
    expect(keys.size()).toBe(3);
    expect(keys.toNative().sort()).toEq(['bar', 'baz', 'foo']);
  });
});

describe('Z.Hash.values', function() {
  it('should return a Z.Array containing all values in the hash', function() {
    var h = Z.H('foo', 1, 'bar', 2, 'baz', 3), values = h.values();

    expect(values.isZArray).toBe(true);
    expect(values.size()).toBe(3);
    expect(values.toNative().sort()).toEq([1, 2, 3]);
  });
});

describe('Z.Hash.hash', function() {
  it('should return a number', function() {
    expect(typeof Z.H().hash()).toBe('number');
    expect(typeof Z.H(1,2,'three','four').hash()).toBe('number');
  });

  it('should return the same value for equivalent hashes', function() {
    expect(Z.H().hash()).toBe(Z.H().hash());
    expect(Z.H('x', 1).hash()).toBe(Z.H('x', 1).hash());
    expect(Z.H(1,2,'three','four').hash()).toBe(Z.H('three','four',1,2).hash());
  });

  it("should return a value that doesn't depend on the order of the keys", function() {
    expect(Z.H({foo: 1, bar: 2}).hash()).toBe(Z.H({bar: 2, foo: 1}).hash());
    expect(Z.H({foo: ['a', 'b'], bar: 3}).hash()).toBe(Z.H({bar: 3, foo: ['a', 'b']}).hash());
  });

  it('should generate a value for recursive hashes', function() {
    var h = Z.H();
    h.at('x', h);

    expect(h.hash()).toBe(h.at('x').hash());
  });

  it('should return the same value for equal recursive objects', function() {
    var h = Z.H();
    h.at('x', h);

    expect(h.hash()).toBe(Z.H('x', h).hash());
    expect(h.hash()).toBe(Z.H('x', Z.H('x', h)).hash());
  });

  it('should return the same value for recursive hashes through arrays', function() {
    var h = Z.H(), rec = Z.A(h);
    h.at('x', rec);

    expect(h.hash()).toBe(Z.H('x', rec).hash());
    expect(h.hash()).toBe(Z.H('x', Z.A(h)).hash());
  });
});

describe('Z.Hash.eq', function() {
  it('should return `false` when passed something other than a Z.Hash', function() {
    var h = Z.H();

    expect(h.eq({})).toBe(false);
    expect(h.eq([])).toBe(false);
    expect(h.eq('foo')).toBe(false);
    expect(h.eq(9)).toBe(false);
    expect(h.eq(null)).toBe(false);
    expect(h.eq(undefined)).toBe(false);
  });

  it('should return `false` when the number of keys differ between the two hashes', function() {
    expect(Z.H().eq(Z.H('foo', 1))).toBe(false);
    expect(Z.H('foo', 1, 'bar', 2).eq(Z.H('foo', 1))).toBe(false);
  });

  it('should return `false` when there are different keys', function() {
    expect(Z.H('foo', 1).eq(Z.H('food', 1))).toBe(false);
  });

  it('should return `false` when there are different values for the same keys', function() {
    expect(Z.H('foo', 1).eq(Z.H('foo', 2))).toBe(false);
    expect(Z.H('foo', 1, 'bar', 2).eq(Z.H('foo', 2, 'bar', 3))).toBe(false);
  });

  it('should return `true` when each key/value pair is equal', function() {
    expect(Z.H().eq(Z.H())).toBe(true);
    expect(Z.H({foo: 1}).eq(Z.H({foo: 1}))).toBe(true);
    expect(Z.H({foo: 1, bar: 2}).eq(Z.H({foo: 1, bar: 2}))).toBe(true);
    expect(Z.H({bar: 2, foo: 1}).eq(Z.H({foo: 1, bar: 2}))).toBe(true);
  });

  it('should handle nested hashes', function() {
    expect(Z.H('a', Z.H('b', 'c')).eq(Z.H('a', Z.H('b', 'c')))).toBe(true);
    expect(Z.H('a', Z.H('b', 'c')).eq(Z.H('a', Z.H('b', 'd')))).toBe(false);
  });

  it('should handle recursive hashes', function() {
    var h = Z.H();
    h.at('a', h);
    expect(h.eq(h.at('a'))).toBe(true);
  });
});

describe('Z.Hash.clear', function() {
  it('should remove all key/value pairs', function() {
    var h = Z.H('foo', 1, {}, 2, 'bar', 3);
    expect(h.size()).toBe(3);
    h.clear();
    expect(h.size()).toBe(0);
  });
});

describe('Z.Hash.hasProperty', function() {
  it('should return `true` for all property names', function() {
    var h = Z.H();

    expect(h.hasProperty('size')).toBe(true);
    expect(h.hasProperty('foo')).toBe(true);
    expect(h.hasProperty('abcdef')).toBe(true);
  });
});

describe('Z.Hash.getUnknownProperty', function() {
  it('should return the value at the given key', function() {
    var h = Z.H('a', 'b', 'c', 'd');
    expect(h.get('a')).toBe('b');
    expect(h.get('c')).toBe('d');
  });
});

describe('Z.Hash.setUnknownProperty', function() {
  it('should insert the given key/value pair', function() {
    var h = Z.H();
    h.set('abc', 123);
    expect(h.size()).toBe(1);
    expect(h.at('abc')).toBe(123);
  });
});

describe('Z.Hash.observe with an unknown property', function() {
  var h, observer = { action: function(n) { this.notifications.push(n); } };

  beforeEach(function() {
    observer.notifications = [];
    h = Z.H({foo: 1});
    h.observe('foo', observer, 'action', { previous: true, current: true });
    h.observe('newkey', observer, 'action', { previous: true, current: true });
  });

  it('should trigger notifications when a key that matches the given name is set', function() {
    h.at('foo', 11);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].path).toBe('foo');
    expect(observer.notifications[0].previous).toBe(1);
    expect(observer.notifications[0].current).toBe(11);
  });

  it('should trigger notifications when a key that matches the given name is inserted', function() {
    h.at('newkey', 'hello');
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].path).toBe('newkey');
    expect(observer.notifications[0].previous).toBe(null);
    expect(observer.notifications[0].current).toBe('hello');
  });

  it('should trigger notifications when a key that matches the given name is deleted', function() {
    h.del('foo');
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].path).toBe('foo');
    expect(observer.notifications[0].previous).toBe(1);
    expect(observer.notifications[0].current).toBe(null);
  });
});

describe('Z.Hash `@` property', function() {
  var observer = { action: function(n) { this.notifications.push(n); } }, h;

  beforeEach(function() {
    observer.notifications = [];
    h = Z.H('foo', 1, 'bar', 2, 'baz', 3);
    h.observe('@', observer, 'action', { previous: true, current: true });
  });

  it('should return the hash object', function() {
    expect(h.get('@')).toBe(h);
  });

  it('should notify observers on insertions', function() {
    h.at('stuff', 9);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].key).toEqual('stuff');
    expect(observer.notifications[0].previous).toBe(null);
    expect(observer.notifications[0].current).toBe(9);
  });

  it('should notify observers on updates', function() {
    h.at('foo', [1,2,3]);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('update');
    expect(observer.notifications[0].key).toEqual('foo');
    expect(observer.notifications[0].previous).toBe(1);
    expect(observer.notifications[0].current).toEq([1,2,3]);
  });

  it('should notify observers on deletions', function() {
    h.del('bar');
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].key).toEqual('bar');
    expect(observer.notifications[0].previous).toBe(2);
    expect(observer.notifications[0].current).toBe(null);
  });
});

}());
