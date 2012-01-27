(function() {

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

describe('Z.eq', function() {
  var A = Z.Object.extend(function() {
    this.property('foo');
    this.def('eq', function(other) {
      return this.foo() === other.foo();
    });
  });

  it('should invoke #eq if the first object is a Z.Object', function() {
    var a1 = A.create({foo: 1}), a2 = A.create({foo: 1});

    expect(a1 === a2).toBe(false);
    expect(Z.eq(a1, a2)).toBe(true);
    a2.foo(2);
    expect(a1 === a2).toBe(false);
    expect(Z.eq(a1, a2)).toBe(false);
  });

  it('should fall back to using the == operator if the first object is not a Z.Object', function() {
    expect(Z.eq('foo', 'foo')).toBe(true);
    expect(Z.eq('foo', 'bar')).toBe(false);
    expect(Z.eq(9, 9)).toBe(true);
    expect(Z.eq(9, 10)).toBe(false);
    expect(Z.eq(null, 0)).toBe(false);
  });
});

describe('Z.hash', function() {
  describe('with `null` or `undefined`', function() {
    it('should return a number', function() {
      expect(typeof Z.hash(undefined)).toBe('number');
      expect(typeof Z.hash(null)).toBe('number');
    });

    it('should always return the same value', function() {
      expect(Z.hash(undefined)).toBe(Z.hash(undefined));
      expect(Z.hash(null)).toBe(Z.hash(null));
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

  describe('with a Date', function() {
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
      // FIXME: http://bugs.ruby-lang.org/issues/1448
      //expect(Z.hash(o)).toBe(Z.hash({x: {x: o}}));
    });

    it('should return the same value for recursive hashes through arrays', function() {
      var o = {}, rec = [o];
      o.x = rec;

      expect(Z.hash(o)).toBe(Z.hash({x: rec}));
      // FIXME: http://bugs.ruby-lang.org/issues/1448
      //expect(Z.hash(o)).toBe(Z.hash({x: [o]}));
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
      var a = [], b = [1];
      a[0] = a;
      b[1] = b;

      expect(Z.hash(a)).toBe(Z.hash(a[0]));
      expect(Z.hash(b)).toBe(Z.hash(b[1]));
    });
  });
});

}());
