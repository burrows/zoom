(function(undefined) {

if (!this.Z) { require('./helper'); }

describe('Z.merge', function() {
  it('should merge values from sources objects into the given destination object', function() {
    var r;

    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 9, baz: 3 });

    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { bar: 10, quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 10, baz: 3, quux: 12 });
  });
});

describe('Z.type', function() {
  it("should return the string 'null' when passed `null`", function() {
    expect(Z.type(null)).toBe('null');
  });

  it("should return the string 'undefined' when passed `undefined`", function() {
    expect(Z.type(undefined)).toBe('undefined');
    expect(Z.type(void 0)).toBe('undefined');
  });

  it("should return the string 'array' when passed an Array instance", function() {
    expect(Z.type([])).toBe('array');
    expect(Z.type([1,2,3])).toBe('array');
  });

  it("should return the string 'arguments' when passed an Arguments instance", function() {
    var args = (function() { return arguments; }());
    expect(Z.type(args)).toBe('arguments');
  });

  it("should return the string 'function' when passed a Function instance", function() {
    expect(Z.type(function() {})).toBe('function');
    expect(Z.type(Object)).toBe('function');
  });

  it("should return the string 'string' when passed a string", function() {
    expect(Z.type('')).toBe('string');
    expect(Z.type('foobar')).toBe('string');
  });

  it("should return the string 'number' when passed a number", function() {
    expect(Z.type(0)).toBe('number');
    expect(Z.type(1.234)).toBe('number');
    expect(Z.type(NaN)).toBe('number');
    expect(Z.type(1/0)).toBe('number');
  });

  it("should return the string 'boolean' when passed `true` or `false`", function() {
    expect(Z.type(true)).toBe('boolean');
    expect(Z.type(false)).toBe('boolean');
  });

  it("should return the string 'date' when passed a Date instance", function() {
    expect(Z.type(new Date())).toBe('date');
  });

  it("should return the string 'regexp' when passed a RegExp instance", function() {
    expect(Z.type(/foo/)).toBe('regexp');
    expect(Z.type(new RegExp())).toBe('regexp');
  });

  it("should return the string 'node' when passed a DOM node", function() {
    expect(Z.type(document.body)).toBe('node');
    expect(Z.type(document.createElement('p'))).toBe('node');
  });

  it("should return the string 'object' when passed an Object instance", function() {
    expect(Z.type({})).toBe('object');
    expect(Z.type({foo: 1})).toBe('object');
  });

  it("should return the string 'zobject' when passed an object with Z.Object in its prototype chain", function() {
    expect(Z.type(Z.Object)).toBe('zobject');
    expect(Z.type(Z.Object.create())).toBe('zobject');
    expect(Z.type(Z.Array.create())).toBe('zobject');
    expect(Z.type(Z.Hash.create())).toBe('zobject');
  });

  it("should return the string 'object' when passed `Z`", function() {
    expect(Z.type(Z)).toBe('object');
  });
});

describe('Z.isA', function() {
  it('should return `true` if the first argument is a descendent of the second and `false` otherwise', function() {
    var o = Z.Object.create();

    expect(Z.isA(Z.A(), Z.Object)).toBe(true);
    expect(Z.isA(Z.A(), Z.Array)).toBe(true);
    expect(Z.isA(Z.SortedArray.create(), Z.Array)).toBe(true);
    expect(Z.isA(o, Z.Object)).toBe(true);
    expect(Z.isA(o.create(), o)).toBe(true);

    expect(Z.isA(Z.A(), Z.Hash)).toBe(false);
    expect(Z.isA(o, Z.Object.create())).toBe(false);
    expect(Z.isA(null, Z.Object)).toBe(false);
    expect(Z.isA(undefined, Z.Object)).toBe(false);
    expect(Z.isA({}, Z.Object)).toBe(false);
    expect(Z.isA([], Z.Object)).toBe(false);
  });
});

describe('Z.isNaN', function() {
  it('should return `true` when passed `NaN` and false otherwise', function() {
    expect(Z.isNaN(NaN)).toBe(true);
    expect(Z.isNaN(1)).toBe(false);
    expect(Z.isNaN(1/0)).toBe(false);
    expect(Z.isNaN('')).toBe(false);
    expect(Z.isNaN([])).toBe(false);
    expect(Z.isNaN({})).toBe(false);
  });
});

describe('Z.inspect', function() {
  describe('given `null`', function() {
    it('should return the string "null"', function() {
      expect(Z.inspect(null)).toBe('null');
    });
  });

  describe('given `undefined`', function() {
    it('should return the string "undefined"', function() {
      expect(Z.inspect(undefined)).toBe('undefined');
    });
  });

  describe('given a function', function() {
    it('should return the string "[Function]"', function() {
      expect(Z.inspect(function() {})).toBe('[Function]');
    });
  });

  describe('given a string', function() {
    it('should return the string wrapped in single quotes', function() {
      expect(Z.inspect('')).toBe("''");
      expect(Z.inspect('foo')).toBe("'foo'");
    });
  });

  describe('given a native array', function() {
    it('should return a string containing all inspected items separated by commas', function() {
      expect(Z.inspect([])).toBe('[]');
      expect(Z.inspect([1, 'two', 3.1])).toBe("[1, 'two', 3.1]");
    });

    it('should handle recursive arrays', function() {
      var a = [1, 2];
      a.push(a);
      expect(Z.inspect(a)).toBe('[1, 2, [...]]');
    });
  });

  describe('given an Arguments object', function() {
    it('should return a string containing all inspected items separated by commas', function() {
      var args = (function() { return arguments; }(1,2,3));
      expect(Z.inspect(args)).toBe('[1, 2, 3]');
    });
  });

  describe('given a plain object', function() {
    it('should return a string containing all key/value pairs', function() {
      expect(Z.inspect({})).toBe('{}');
      expect(Z.inspect({foo: 1, bar: 2, baz: [1,2,3]})).toBe('{foo: 1, bar: 2, baz: [1, 2, 3]}');
    });

    it('should handle recursive objects', function() {
      var o = {foo: 'one'};
      o.bar = o;
      expect(Z.inspect(o)).toBe("{foo: 'one', bar: {...}}");
    });
  });

  describe('given a DOM element', function() {
    it('should return string containing the the node name and id and class attributes', function() {
      var div = document.createElement('div'),
          p   = document.createElement('p'),
          h1  = document.createElement('h1');

      p.id = 'foo';
      h1.id = 'bar';
      h1.className = 'a b';

      expect(Z.inspect(div)).toBe('<div />');
      expect(Z.inspect(p)).toBe('<p id="foo" />');
      expect(Z.inspect(h1)).toBe('<h1 id="bar" class="a b" />');
    });
  });

  describe('given a Z.Object', function() {
    it("should invoke the object's `toString` method", function() {
      var o = Z.Object.create();
      spyOn(o, 'toString');
      Z.inspect(o);
      expect(o.toString).toHaveBeenCalled();
    });
  });
});

describe('Z.eq', function() {
  describe('given a Z.Object as the first argument', function() {
    it('should invoke `eq` if the first object is a Z.Object', function() {
      var a = Z.Object.create(), b = Z.Object.create();

      spyOn(a, 'eq');
      Z.eq(a, b);
      expect(a.eq).toHaveBeenCalledWith(b);
    });
  });

  it('should return `true` for identical objects', function() {
    var a = [1,2], o = {foo: 1}, d = new Date(2012, 0, 29), r = /x/i;
    expect(Z.eq(null, null)).toBe(true);
    expect(Z.eq(undefined, undefined)).toBe(true);
    expect(Z.eq(true, true)).toBe(true);
    expect(Z.eq(false, false)).toBe(true);
    expect(Z.eq(1, 1)).toBe(true);
    expect(Z.eq('foo', 'foo')).toBe(true);
    expect(Z.eq(r, r)).toBe(true);
    expect(Z.eq(d, d)).toBe(true);
    expect(Z.eq(a, a)).toBe(true);
    expect(Z.eq(o, o)).toBe(true);
  });

  it('should return `false` when given `null` and `undefined`', function() {
    expect(Z.eq(null, undefined)).toBe(false);
    expect(Z.eq(undefined, null)).toBe(false);
  });

  it('should return `true` for string primitives and their corresponding wrapper objects', function() {
    expect(Z.eq('foo', 'foo')).toBe(true);
    expect(Z.eq('foo', new String('foo'))).toBe(true);
    expect(Z.eq(new String('foo'), 'foo')).toBe(true);
    expect(Z.eq(new String('foo'), new String('foo'))).toBe(true);
  });

  it('should return `false` for string primitives with different values', function() {
    expect(Z.eq('foo', 'bar')).toBe(false);
    expect(Z.eq('foo', 'Foo')).toBe(false);
  });

  it('should return `false` for string objects with different values', function() {
    expect(Z.eq(new String('foo'), new String('Foo'))).toBe(false);
  });

  it('should return `true` when given `0` and `-0`', function() {
    expect(Z.eq(0, -0)).toBe(true);
    expect(Z.eq(-0, 0)).toBe(true);
  });

  it('should return `true` for number primitives and their corresponding wrapper objects', function() {
    expect(Z.eq(21, 21)).toBe(true);
    expect(Z.eq(new Number(21), new Number(21))).toBe(true);
    expect(Z.eq(21, new Number(21))).toBe(true);
    expect(Z.eq(new Number(21), 21)).toBe(true);
  });

  it('should return `false` for number objects with different values', function() {
    expect(Z.eq(new Number(21), new Number(-21))).toBe(false);
    expect(Z.eq(new Number(21), 22)).toBe(false);
    expect(Z.eq(23, new Number(22))).toBe(false);
    expect(Z.eq(23, 23.1)).toBe(false);
  });

  it('should return `false` when both objects are `NaN`', function() {
    expect(Z.eq(NaN, NaN)).toBe(false);
  });

  it('should return `false` when `NaN` is compared with any other number value', function() {
    expect(Z.eq(NaN, 1)).toBe(false);
    expect(Z.eq(1, NaN)).toBe(false);
    expect(Z.eq(new Number(1), NaN)).toBe(false);
    expect(Z.eq(NaN, new Number(2))).toBe(false);
    expect(Z.eq(NaN, Infinity)).toBe(false);
    expect(Z.eq(Infinity, NaN)).toBe(false);
  });

  it('should return `true` for boolean primitives and their corresponding wrapper objects', function() {
    expect(Z.eq(true, true)).toBe(true);
    expect(Z.eq(false, false)).toBe(true);
    expect(Z.eq(true, new Boolean(true))).toBe(true);
    expect(Z.eq(new Boolean(true), true)).toBe(true);
    expect(Z.eq(new Boolean(true), new Boolean(true))).toBe(true);
    expect(Z.eq(false, new Boolean(false))).toBe(true);
    expect(Z.eq(new Boolean(false), false)).toBe(true);
    expect(Z.eq(new Boolean(false), new Boolean(false))).toBe(true);
    expect(Z.eq(new Boolean(), new Boolean())).toBe(true);
    expect(Z.eq(new Boolean(false), new Boolean())).toBe(true);
    expect(Z.eq(new Boolean(), new Boolean(false))).toBe(true);
  });

  it('should return `false` for boolean objects with different primitive objects', function() {
    expect(Z.eq(true, false)).toBe(false);
    expect(Z.eq(false, true)).toBe(false);
    expect(Z.eq(new Boolean(false), new Boolean(true))).toBe(false);
    expect(Z.eq(new Boolean(true), new Boolean(false))).toBe(false);
    expect(Z.eq(false, new Boolean(true))).toBe(false);
    expect(Z.eq(new Boolean(true), false)).toBe(false);
    expect(Z.eq(new Boolean(true), new Boolean())).toBe(false);
  });

  it('should return `true` for date objects containing identical times and `false` otherwise', function() {
    expect(Z.eq(new Date(2012, 0, 30), new Date(2012, 0, 30))).toBe(true);
    expect(Z.eq(new Date(2012, 0, 30, 8, 17, 1, 1), new Date(2012, 0, 30, 8, 17, 1, 1))).toBe(true);
    expect(Z.eq(new Date(2012, 1, 2), new Date(2012, 1, 3))).toBe(false);
    expect(Z.eq(new Date(2012, 1, 2, 6, 36, 0, 0), new Date(2012, 1, 2, 6, 36, 0, 1))).toBe(false);
  });

  it('should return `true` when given identical function references and `false` otherwise', function() {
    var f = function() {};

    expect(Z.eq(f, f)).toBe(true);
    expect(Z.eq(f, function() {})).toBe(false);
  });

  it('should return `true` for regular expressions with equal patterns and flags', function() {
    expect(Z.eq(/^a*/gi, /^a*/gi)).toBe(true);
    expect(Z.eq(/^a*/ig, /^a*/gi)).toBe(true);
    expect(Z.eq(new RegExp('^a*', 'igm'), new RegExp('^a*', 'igm'))).toBe(true);
    expect(Z.eq(new RegExp('^a*', 'igm'), new RegExp('^a*', 'mig'))).toBe(true);
    expect(Z.eq(/^a*/gim, new RegExp('^a*', 'mig'))).toBe(true);
  });

  it('should return `false` for regular expressions where the patterns differ', function() {
    expect(Z.eq(/^a*/, /a*/)).toBe(false);
    expect(Z.eq(/^a*/ig, /a*/ig)).toBe(false);
    expect(Z.eq(new RegExp('^a*'), new RegExp('a*'))).toBe(false);
  });

  it('should return `false` for regular expressions where the flags differ', function() {
    expect(Z.eq(/^a*/, /^a*/i)).toBe(false);
    expect(Z.eq(new RegExp('^a*', 'i'), new RegExp('a*', 'g'))).toBe(false);
  });

  describe('with native arrays', function() {
    it('should return `false` if any corresponding elements are not equal', function() {
      expect(Z.eq([], [1])).toBe(false);
      expect(Z.eq([2], [1])).toBe(false);
      expect(Z.eq([1, 2], [1])).toBe(false);
      expect(Z.eq([1, 2], [2, 1])).toBe(false);
      expect(Z.eq([/x/], [/x/i])).toBe(false);
    });

    it('should return `true` if all corresponding elements are equal', function() {
      expect(Z.eq([], [])).toBe(true);
      expect(Z.eq([1], [1])).toBe(true);
      expect(Z.eq([1, 'two', /3*/g], [1, 'two', /3*/g])).toBe(true);
    });

    it('should handle recursive arrays', function() {
      var a1 = [1], a2 = [1], back, forth, x;

      a1.push(a1);
      a2.push(a2);
      expect(Z.eq(a1, a2)).toBe(true);

      a1.push(a1);
      a2.push(a1);
      expect(Z.eq(a1, a2)).toBe(true);

      a2.push('foo');
      expect(Z.eq(a1, a2)).toBe(false);

      a1 = [];
      a1.push(a1);

      expect(Z.eq(a1, [a1])).toBe(true);
      expect(Z.eq(a1, [[a1]])).toBe(true);
      expect(Z.eq([a1], a1)).toBe(true);
      expect(Z.eq([[a1]], a1)).toBe(true);

      back = [];
      forth = [back];
      back.push(forth);
      expect(Z.eq(back, a1)).toBe(true);

      x = [];
      x.push(x, x);
      expect(Z.eq(x, a1)).toBe(false);
      expect(Z.eq(x, [a1, a1])).toBe(false);
      expect(Z.eq(x, [x, a1])).toBe(false);
      expect(Z.eq([x, a1], [a1, x])).toBe(false);
      expect(Z.eq(x, [x, x])).toBe(true);
      expect(Z.eq(x, [[x, x], [x, x]])).toBe(true);
    });

    it('should handle multi-demenionsal arrays', function() {
      expect(Z.eq([[]], [[]])).toBe(true);
      expect(Z.eq([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(Z.eq([1, [2, 3]], [1, 2, [3]])).toBe(false);
    });

    it('should ignore non-numeric properties', function() {
      var a1 = [1, 2, 3], a2 = [1, 2, 3];

      a1.foo = 'bar';
      expect(Z.eq(a1, a2)).toBe(true);
    });
  });

  describe('with plain objects', function() {
    it('should return `false` when the number of keys differ between the two objects', function() {
      expect(Z.eq({}, {foo: 1})).toBe(false);
      expect(Z.eq({foo: 1, bar: 2}, {foo: 1})).toBe(false);
    });

    it('should return `false` when there are different keys', function() {
      expect(Z.eq({foo: 1}, {food: 1})).toBe(false);
    });

    it('should return `false` when there are different values for the same keys', function() {
      expect(Z.eq({foo: 1}, {foo: 2})).toBe(false);
      expect(Z.eq({foo: 1, bar: 2}, {foo: 2, bar: 3})).toBe(false);
    });

    it('should return `true` when each key/value pair is equal', function() {
      expect(Z.eq({}, {})).toBe(true);
      expect(Z.eq({foo: 1}, {foo: 1})).toBe(true);
      expect(Z.eq({foo: 1, bar: 2}, {foo: 1, bar: 2})).toBe(true);
      expect(Z.eq({bar: 2, foo: 1}, {foo: 1, bar: 2})).toBe(true);
    });

    it('should handle nested objects', function() {
      expect(Z.eq({a: {b: 'c'}}, {a: {b: 'c'}})).toBe(true);
      expect(Z.eq({a: {b: 'c'}}, {a: {b: 'd'}})).toBe(false);

      expect(Z.eq({ a: { b: [ { stuff: true }, 2, 3 ] }, foo: /y/ },
                  { foo: /y/, a: { b: [ { stuff: true }, 2, 3 ] } })).toBe(true);

      expect(Z.eq({ a: { b: [ { stuff: true }, 2, 3 ] }, foo: /y/ },
                  { foo: /y/, a: { b: [ { stuff: false }, 2, 3 ] } })).toBe(false);
    });

    it('should handle recursive objects', function() {
      var o = {};
      o.a = o;

      expect(Z.eq(o, o.a)).toBe(true);
    });

    it('should handle complex recursive objects', function() {
      var a = {}, b = {}, c = {};

      a.self  = a;
      a.other = b;
      b.self  = b;
      b.other = a;
      expect(Z.eq(a, b)).toBe(true);
      expect(Z.hash(a)).toBe(Z.hash(b));

      c.other = c;
      c.self  = c;
      expect(Z.eq(c, a)).toBe(true);

      a.delta = a;
      c.delta = a;
      expect(Z.eq(c, a)).toBe(false);

      c.delta = 42;
      expect(Z.eq(c, a)).toBe(false);

      a.delta = 42;
      expect(Z.eq(c, a)).toBe(false);

      b.delta = 42;
      expect(Z.eq(c, a)).toBe(true);
    });

    it('should handle complex recursive objects and arrays', function() {
      var x = [], y = [], z = [], a, b, c;

      a = {foo: x, bar: 42};
      b = {foo: y, bar: 42};
      c = {foo: z, bar: 42};

      x.push(a);
      y.push(c);
      z.push(b);

      expect(Z.eq(b, c)).toBe(true);
      expect(Z.eq(y, z)).toBe(true);
      expect(Z.eq(a, b)).toBe(true);

      expect(Z.eq(x, y)).toBe(true);
      y.push(x);
      expect(Z.eq(y, z)).toBe(false);
      z.push(x);
      expect(Z.eq(y, z)).toBe(true);

      a.foo = a.bar;
      a.bar = a.foo;
      expect(Z.eq(a, b)).toBe(false);
      b.bar = b.foo;
      expect(Z.eq(b, c)).toBe(false);
    });
  });
});

describe('Z.get', function() {
  describe('given the name of a global variable', function() {
    it('should return the value of the global variable', function() {
      Z.global.Something = 9;
      expect(Z.get('Something')).toBe(9);
      Z.del(Z.global, 'Something');
    });
  });

  describe('given a path containing native objects', function() {
    it('should return the value at the end of the path', function() {
      Z.global.A = { b: { c: 'blah' } };
      expect(Z.get('A.b.c')).toBe('blah');
      Z.del(Z.global, 'A');
    });
  });

  describe('given a path zobjects', function() {
    it('should return the value at the end of the path', function() {
      Z.global.A = Z.H('b', Z.H('c', 'foo'));
      expect(Z.get('A.b.c')).toBe('foo');
      Z.del(Z.global, 'A');
    });
  });

  describe('given a path to a non-existant object', function() {
    it('should return `undefined`', function() {
      expect(Z.get('Foo')).toBeUndefined();
      expect(Z.get('Foo.bar.baz')).toBeUndefined();
    });
  });
});

describe('Z.set', function() {
  describe('given a path with one segement', function() {
    it('should throw an exception', function() {
      expect(function() {
        Z.set('foo', 1);
      }).toThrow("Z.set: must be given a path with multiple segments");
    });
  });

  describe('given a path that does not resolve', function() {
    it('should throw an exception', function() {
      var ctx = {foo: {}};

      expect(function() {
        Z.set('blah.bar', 1, ctx);
      }).toThrow("Z.set: could not resolve path: 'blah'");
    });
  });

  describe('given a path to something that is not a Z.Object', function() {
    it('should throw an exception', function() {
      var ctx = {foo: {}};

      expect(function() {
        Z.set('foo.bar', 1, ctx);
      }).toThrow("Z.set: path did not resolve to a Z.Object: 'foo'");
    });
  });

  it('should set the given value at the given path', function() {
    var o = Z.Object.create(), ctx = {o: o};
    o.prop('foo');
    Z.set('o.foo', 9, ctx);
    expect(o.foo()).toBe(9);
  });
});

describe('Z.binsearch', function() {
  var a = [1,3,4,7,12,20,22,54,68];

  it('should return the index of the array where the given object is found', function() {
    expect(Z.binsearch(1, a)).toBe(0);
    expect(Z.binsearch(3, a)).toBe(1);
    expect(Z.binsearch(4, a)).toBe(2);
    expect(Z.binsearch(7, a)).toBe(3);
    expect(Z.binsearch(12, a)).toBe(4);
    expect(Z.binsearch(20, a)).toBe(5);
    expect(Z.binsearch(22, a)).toBe(6);
    expect(Z.binsearch(54, a)).toBe(7);
    expect(Z.binsearch(68, a)).toBe(8);
  });

  it('should return the insertion index multiplied by -1 and decremented by 1 when the object is not found', function() {
    expect(Z.binsearch(0, a)).toBe(-1);
    expect(Z.binsearch(0.5, a)).toBe(-1);
    expect(Z.binsearch(2, a)).toBe(-2);
    expect(Z.binsearch(5, a)).toBe(-4);
    expect(Z.binsearch(8, a)).toBe(-5);
    expect(Z.binsearch(23, a)).toBe(-8);
    expect(Z.binsearch(67, a)).toBe(-9);
    expect(Z.binsearch(69, a)).toBe(-10);
  });
});

}());
