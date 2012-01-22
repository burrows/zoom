(function() {

var Z = this.Z || require('zoom');

describe('Z.Model.attribute', function() {
  var X = Z.Model.extend(function() {
    this.attribute('foo', 'string');
    this.attribute('bar', 'integer');
  });

  it('should define a property with the given name', function() {
    expect(X.hasProperty('foo')).toBe(true);
    expect(X.create({foo: 'hello'}).foo()).toBe('hello');
    expect(X.create({foo: 'goodbye'}).get('foo')).toBe('goodbye');
  });

  describe('`string` type', function() {
    var x;

    beforeEach(function() { x = X.create(); });

    it('should not transform string values', function() {
      x.set('foo', 'regular string');
      expect(x.get('foo')).toBe('regular string');
    });

    it('should allow setting `null`', function() {
      x.set('foo', 'a');
      expect(x.get('foo')).toBe('a');
      x.set('foo', null);
      expect(x.get('foo')).toBe(null);
    });

    it('should convert non-string, non-null values to a string using `toString`', function() {
      var Bar = Z.Object.extend(function() {
        this.def('toString', function() { return 'frobnob'; });
      });

      x.set('foo', 9);
      expect(x.get('foo')).toBe('9');
      x.set('foo', Bar.create());
      expect(x.get('foo')).toBe('frobnob');
    });
  });

  describe('`integer` type', function() {
    var x;

    beforeEach(function() { x = X.create(); });

    it('should not transform integer values', function() {
      x.set('bar', 9);
      expect(x.get('bar')).toBe(9);
    });

    it('should round float values', function() {
      x.set('bar', 9.12);
      expect(x.get('bar')).toBe(9);
      x.set('bar', 9.88);
      expect(x.get('bar')).toBe(10);
    });

    it('should allow setting `null`', function() {
      x.set('bar', 8);
      expect(x.get('bar')).toBe(8);
      x.set('bar', null);
      expect(x.get('bar')).toBe(null);
    });

    it('should convert string values using `parseInt`', function() {
      x.set('bar', '1234');
      expect(x.get('bar')).toBe(1234);
      x.set('bar', '88.88');
      expect(x.get('bar')).toBe(89);
    });
  });
});

describe('Z.Model.initialize', function() {
  var TestModel = Z.Model.extend(function() {
    this.attribute('foo', 'integer');
    this.attribute('bar', 'integer');
  });

  it('should set the given attributes', function() {
    var m = TestModel.create({ foo: 1, bar: 2 });

    expect(m.foo()).toBe(1);
    expect(m.get('bar')).toBe(2);
  });

  it('should set the the state to NEW', function() {
    var m = TestModel.create({ foo: 1, bar: 2 });

    expect(m.state()).toBe(Z.Model.NEW);
  });

  it('should set the state the the given state when passed a state as the second argument', function() {
    var m = TestModel.create({ foo: 1, bar: 2 }, Z.Model.LOADED);

    expect(m.state()).toBe(Z.Model.LOADED);
  });
});

describe('Z.Model.toJSON', function() {
  var X = Z.Model.extend(function() {
    this.attribute('foo', 'string');
    this.attribute('bar', 'integer');
  });

  describe('with no associations', function() {
    it('should return an object with all raw attribute values', function() {
      var x = X.create({foo: 'abc', bar: 22});
      expect(x.toJSON()).toEqual({foo: 'abc', bar: 22});
    });
  });
});

describe('Z.Model many-to-one association', function() {
  var Foo, Bar;

  Foo = Z.Model.extend(function() {
    this.hasMany('bars', 'Bar', { inverse: 'foo' });
  });

  Bar = Z.Model.extend(function() {
    this.hasOne('foo', 'Foo', { inverse: 'bars' });
  });

  beforeEach(function() {
    Z.root.Foo = Foo;
    Z.root.Bar = Bar;
  });

  afterEach(function() {
    delete Z.root.Foo;
    delete Z.root.Bar;
  });

  it('should create properties on each side of the association', function() {
    expect(Foo.hasProperty('bars')).toBe(true);
    expect(Bar.hasProperty('foo')).toBe(true);
  });

  it('should initialize hasMany property to an empty Z.Array', function() {
    expect(Foo.create().bars()).toEq(Z.A());
  });

  it('should initialize hasOne property to null', function() {
    expect(Bar.create().foo()).toBe(null);
  });

  describe('adding objects to the hasMany side', function() {
    it('should set the inverse on the hasOne side if the `inverse` option is set on the hasMany side', function() {
      var f = Foo.create(), b1 = Bar.create(), b2 = Bar.create();

      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
      f.bars().push(b1);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
    });
  });

  describe('removing objects from the hasMany side', function() {
    it('should clear the inverse on the hasOne side', function() {
      var f = Foo.create(), b1 = Bar.create(), b2 = Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars().pop();
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
    });
  });

  describe('replacing the Z.Array object on the hasMany side', function() {
    it('should clear the inverse on all items in the old array', function() {
      var f = Foo.create(), b1 = Bar.create(), b2 = Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars(Z.A());
      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
    });

    it('should set the inverse on all items in the new array', function() {
      var f = Foo.create(), b1 = Bar.create(), b2 = Bar.create(), b3 = Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars(Z.A(b3));
      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
      expect(b3.foo()).toBe(f);
    });
  });

  describe('setting an object on the hasOne side', function() {
    it('should add the receiver to the array on the hasMany side', function() {
      var f = Foo.create(), b = Bar.create();

      expect(b.foo()).toBe(null);
      expect(f.bars()).toEq(Z.A());
      b.set('foo', f);
      expect(b.foo()).toBe(f);
      expect(f.bars()).toEq(Z.A(b));
    });

    it('should remove the receiver from its previous association if one exists', function() {
      var f1 = Foo.create(), f2 = Foo.create(), b = Bar.create();

      b.foo(f1);
      expect(f1.bars()).toEq(Z.A(b));
      expect(f2.bars()).toEq(Z.A());
      b.foo(f2);
      expect(f1.bars()).toEq(Z.A());
      expect(f2.bars()).toEq(Z.A(b));
      b.foo(null);
      expect(f1.bars()).toEq(Z.A());
      expect(f2.bars()).toEq(Z.A());
    });
  });
});

describe('Z.Model many-to-one association', function() {
  var Foo, Bar;

  Foo = Z.Model.extend(function() {
    this.hasMany('bars', 'Bar', { inverse: 'foos' });
  });

  Bar = Z.Model.extend(function() {
    this.hasMany('foos', 'Foo', { inverse: 'bars' });
  });

  beforeEach(function() {
    Z.root.Foo = Foo;
    Z.root.Bar = Bar;
  });

  afterEach(function() {
    delete Z.root.Foo;
    delete Z.root.Bar;
  });

  it('should create properties on each side of the association', function() {
    expect(Foo.hasProperty('bars')).toBe(true);
    expect(Bar.hasProperty('foos')).toBe(true);
  });

  it('should initialize both hasMany properties to empty Z.Arrays', function() {
    expect(Foo.create().bars()).toEq(Z.A());
    expect(Bar.create().foos()).toEq(Z.A());
  });

  describe('adding objects to the association', function() {
    it("should add the given object to the receiver's array and the receiver to the given object's array", function() {
      var f1 = Foo.create(),
          b1 = Bar.create(),
          b2 = Bar.create();

      expect(f1.bars()).toEq(Z.A());
      expect(b1.foos()).toEq(Z.A());
      expect(b2.foos()).toEq(Z.A());

      f1.bars().push(b1);

      expect(f1.bars()).toEq(Z.A(b1));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A());

      f1.bars().push(b2);

      expect(f1.bars()).toEq(Z.A(b1, b2));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A(f1));
    });
  });

  describe('removing objects from the association', function() {
    it("should remove the given object from the receiver's array and the receiver from the given object's array", function() {
      var f1 = Foo.create(),
          b1 = Bar.create(),
          b2 = Bar.create();

      f1.bars().push(b1);
      f1.bars().push(b2);

      expect(f1.bars()).toEq(Z.A(b1, b2));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A(f1));

      f1.bars().pop();

      expect(f1.bars()).toEq(Z.A(b1));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A());

      b1.foos().pop();

      expect(f1.bars()).toEq(Z.A());
      expect(b1.foos()).toEq(Z.A());
      expect(b2.foos()).toEq(Z.A());
    });
  });
});

describe('Z.Model one-to-one association', function() {
  var Foo, Bar;

  Foo = Z.Model.extend(function() {
    this.hasOne('bar', 'Bar', { inverse: 'foo' });
  });

  Bar = Z.Model.extend(function() {
    this.hasOne('foo', 'Foo', { inverse: 'bar' });
  });

  beforeEach(function() {
    Z.root.Foo = Foo;
    Z.root.Bar = Bar;
  });

  afterEach(function() {
    delete Z.root.Foo;
    delete Z.root.Bar;
  });

  it('should create properties on each side of the association', function() {
    expect(Foo.hasProperty('bar')).toBe(true);
    expect(Bar.hasProperty('foo')).toBe(true);
  });

  it('should initialize both hasOne properties to null', function() {
    expect(Foo.create().bar()).toBe(null);
    expect(Bar.create().foo()).toBe(null);
  });

  describe('setting one side of the association', function() {
    it("should set receiver as the inverse", function() {
      var f1 = Foo.create(),
          f2 = Foo.create(),
          b1 = Bar.create(),
          b2 = Bar.create();

      f1.bar(b1);
      expect(b1.foo()).toBe(f1);

      b2.foo(f2);
      expect(b2.foo()).toBe(f2);
    });

    it('should clear both sides of the association when one side is set to null', function() {
      var f = Foo.create(), b = Bar.create();

      f.bar(b);
      expect(f.bar()).toBe(b);
      expect(b.foo()).toBe(f);
      f.bar(null);
      expect(f.bar()).toBe(null);
      expect(b.foo()).toBe(null);
    });
  });
});

}());
