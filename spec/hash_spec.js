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

    it('should return the same value for recursive hashes through arrays', function() {
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

}());
