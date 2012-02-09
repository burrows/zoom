(function(undefined) {

var Z = this.Z || require('zoom');

describe('Z.merge', function() {
  it('should merge values from sources objects into the given destination object', function() {
    var r;
    
    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 9, baz: 3 });

    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { bar: 10, quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 10, baz: 3, quux: 12 });
  });
});

describe('Z.defaults', function() {
  it('should merge values from default objects that are not present in the given object', function() {
    var r;

    r = Z.defaults({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 2, baz: 3 });
    r = Z.defaults({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 2, baz: 3, quux: 12 });
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
    expect(Z.eq(new Boolean, new Boolean)).toBe(true);
    expect(Z.eq(new Boolean(false), new Boolean)).toBe(true);
    expect(Z.eq(new Boolean, new Boolean(false))).toBe(true);
  });

  it('should return `false` for boolean objects with different primitive objects', function() {
    expect(Z.eq(true, false)).toBe(false);
    expect(Z.eq(false, true)).toBe(false);
    expect(Z.eq(new Boolean(false), new Boolean(true))).toBe(false);
    expect(Z.eq(new Boolean(true), new Boolean(false))).toBe(false);
    expect(Z.eq(false, new Boolean(true))).toBe(false);
    expect(Z.eq(new Boolean(true), false)).toBe(false);
    expect(Z.eq(new Boolean(true), new Boolean)).toBe(false);
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

}());
