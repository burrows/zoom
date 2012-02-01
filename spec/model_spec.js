(function() {

var Z = this.Z || require('zoom'), TestModel;

TestModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
});

describe('Z.Model.attribute', function() {
  it('should define a property with the given name', function() {
    expect(TestModel.hasProperty('foo')).toBe(true);
    expect(TestModel.create({foo: 'hello'}).foo()).toBe('hello');
    expect(TestModel.create({foo: 'goodbye'}).get('foo')).toBe('goodbye');
  });

  describe('`string` type', function() {
    var x;

    beforeEach(function() { x = TestModel.create(); });

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

    beforeEach(function() { x = TestModel.create(); });

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

describe('Z.Model.load', function() {
  beforeEach(function() { Z.Model.clearIdentityMap(); });

  describe('given attributes containing an id not in the identity map', function() {
    it('should return a new model instance with the given attributes', function() {
      var m = TestModel.load({ id: 126, foo: 's', bar: 1 });

      expect(m.type()).toBe(TestModel);
      expect(m.id()).toBe(126);
      expect(m.foo()).toBe('s');
      expect(m.bar()).toBe(1);
    });

    it('should add the new model instance to the identity map', function() {
      var m = TestModel.load({ id: 127, foo: 's', bar: 1 });

      expect(TestModel.fetch(127)).toBe(m);
    });

    it('should set the state of the instance to LOADED', function() {
      var m = TestModel.load({ id: 128, foo: 's', bar: 1 });

      expect(m.state()).toBe(Z.Model.LOADED);
    });
  });

  describe('given attributes containing an id that is in the identity map', function() {
    it('should update and return the object that is already in the identity map', function() {
      var m = TestModel.load({ id: 200, foo: 's', bar: 1 });

      TestModel.load({ id: 200, foo: 's2', bar: 2 });

      expect(m.foo()).toBe('s2');
      expect(m.bar()).toBe(2);
    });

    it('should set the state of the instance to LOADED', function() {
      var m = TestModel.load({ id: 201, foo: 's', bar: 1 });

      m.state(Z.Model.DIRTY);
      expect(m.state()).toBe(Z.Model.DIRTY);

      TestModel.load({ id: 201, foo: 's3', bar: 3 });

      expect(m.state()).toBe(Z.Model.LOADED);
      expect(m.foo()).toBe('s3');
      expect(m.bar()).toBe(3);
    });
  });

  describe('given attributes that do not include an id', function() {
    it('should throw an exception', function() {
      expect(function() {
        TestModel.load({ foo: 's', bar: 1 });
      }).toThrow('Z.Model.load: an `id` attribute is required');
    });
  });
});

describe('Z.Model.initialize', function() {
  it('should set the given attributes', function() {
    var m = TestModel.create({ foo: 'abc', bar: 1 });

    expect(m.foo()).toBe('abc');
    expect(m.get('bar')).toBe(1);
  });

  it('should set the the state to NEW', function() {
    var m = TestModel.create({ foo: 'abc', bar: 1 });

    expect(m.state()).toBe(Z.Model.NEW);
  });

  it('should set the state the the given state when passed a state as the second argument', function() {
    var m = TestModel.create({ foo: 'abc', bar: 1 }, Z.Model.LOADED);

    expect(m.state()).toBe(Z.Model.LOADED);
  });
});

describe('Z.Model id property', function() {
  it('should throw an exception when setting it when it already has a non-null value', function() {
    var m = TestModel.create({ id: 1 });

    expect(m.id()).toBe(1);
    expect(function() {
      m.id(9);
    }).toThrow("Z.Model.id (setter): overwriting a model's identity is not allowed: " + m.toString());
    expect(m.id()).toBe(1);
  });

  it('should add the model to the identity map once its been set for the firs time', function() {
    var m = TestModel.create();

    m.set('id', 8734);
    expect(TestModel.fetch(8734)).toBe(m);
  });
});

describe('Z.Model.fetch', function() {
  beforeEach(function() {
    spyOn(TestModel.mapper, 'fetchModel');
    Z.Model.clearIdentityMap();
  });

  describe('for an id of a model that is already loaded into the identity map', function() {
    it('should return a reference to the already existing object', function() {
      var m = TestModel.create({id: 1234, foo: 'a', bar: 2}, Z.Model.LOADED);

      expect(TestModel.fetch(1234)).toBe(m);
    });
  });

  describe('for an id of a model that is not in the identity map', function() {
    it("should invoke the `fetchModel` method on the type's mapper", function() {
      TestModel.fetch(18);
      expect(TestModel.mapper.fetchModel).toHaveBeenCalledWith(TestModel, 18);
    });

    it('should return an instance of the model in the EMPTY state', function() {
      var m = TestModel.fetch(19);

      expect(m.type()).toBe(TestModel);
      expect(m.id()).toBe(19);
      expect(m.state()).toBe(Z.Model.EMPTY);
    });

    it('should add the EMPTY instance to the identity map', function() {
      var m = TestModel.fetch(20);

      expect(TestModel.fetch(20)).toBe(m);
    });
  });
});

describe('Z.Model.fetchModelDidFail', function() {
  beforeEach(function() { Z.Model.clearIdentityMap(); });

  it('should retrieve the record with the given id from the identity map and set its state to `NOT_FOUND`', function() {
    var m = TestModel.create({id: 1}, Z.Model.EMPTY);

    expect(m.state()).toBe(Z.Model.EMPTY);
    TestModel.fetchModelDidFail(1);
    expect(m.state()).toBe(Z.Model.NOT_FOUND);
  });

  it('should throw an exception if a record with the given id is not in the identity map', function() {
    expect(function() {
      TestModel.fetchModelDidFail(3);
    }).toThrow('Z.Model.fetchModelDidFail: no object exists with id 3');
  });
});

describe('Z.Model.save', function() {
  beforeEach(function() {
    Z.Model.clearIdentityMap();
    spyOn(Z.Model.mapper, 'createModel');
    spyOn(Z.Model.mapper, 'updateModel');
  });

  describe('for a NEW model', function() {
    it("should invoke the `createModel` method on type's mapper", function() {
      var m = TestModel.create({id: 1, foo: 'x', bar: 9 });

      m.save();
      expect(TestModel.mapper.createModel).toHaveBeenCalledWith(m);
    });
  });

  describe('for a DIRTY model', function() {
    it("should invoke the `updateModel` method on type's mapper", function() {
      var m = TestModel.create({id: 1, foo: 'x', bar: 9 }, Z.Model.DIRTY);

      m.save();
      expect(TestModel.mapper.updateModel).toHaveBeenCalledWith(m);
    });
  });

  describe('for a LOADED model', function() {
    it("should do nothing", function() {
      var m = TestModel.load({id: 1, foo: 'x', bar: 9 });

      m.save();
      expect(TestModel.mapper.createModel).not.toHaveBeenCalled();
      expect(TestModel.mapper.updateModel).not.toHaveBeenCalled();
    });
  });

  describe('for a model that is not NEW, DIRTY, or LOADED', function() {
    it('should throw an exception', function() {
      var m = TestModel.create({id: 1}, Z.Model.EMPTY);

      expect(function() {
        m.save();
      }).toThrow('Z.Model.save: attempted to save a model in the `empty` state');

      expect(function() {
        m = TestModel.create({id: 1}, Z.Model.DESTROYED);
        m.save();
      }).toThrow('Z.Model.save: attempted to save a model in the `destroyed` state');

      expect(function() {
        m = TestModel.create({id: 1}, Z.Model.BUSY);
        m.save();
      }).toThrow('Z.Model.save: attempted to save a model in the `busy` state');

      expect(function() {
        m = TestModel.create({id: 1}, Z.Model.NOT_FOUND);
        m.save();
      }).toThrow('Z.Model.save: attempted to save a model in the `not found` state');

      expect(function() {
        m = TestModel.create({id: 1}, Z.Model.ERROR);
        m.save();
      }).toThrow('Z.Model.save: attempted to save a model in the `error` state');
    });
  });
});

describe('Z.Model.clearIdentityMap', function() {
  it('should remove all objects from the identity map', function() {
    var m = TestModel.create({id: 1111});

    expect(TestModel.fetch(1111)).toBe(m);
    Z.Model.clearIdentityMap();
    expect(TestModel.fetch(1111)).not.toBe(m);
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
    Z.del(Z.root, 'Foo');
    Z.del(Z.root, 'Bar');
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
    Z.del(Z.root, 'Foo');
    Z.del(Z.root, 'Bar');
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
    Z.del(Z.root, 'Foo');
    Z.del(Z.root, 'Bar');
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