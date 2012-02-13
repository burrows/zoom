(function() {

var Z = this.Z || require('zoom'), BasicModel, ValidatedModel;

BasicModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
});

ValidatedModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
  this.registerValidator('validatePresenceOfFoo');
  this.registerValidator('validateBarIsOver20');

  this.def('validatePresenceOfFoo', function() {
    if (!this.foo()) { this.addError('foo', 'foo must be present'); }
  });

  this.def('validateBarIsOver20', function() {
    var bar = this.bar();
    if (!bar || bar < 20) { this.addError('bar', 'bar must be over 20'); }
  });
});

describe('Z.Model.attribute', function() {
  it('should define a property with the given name', function() {
    expect(BasicModel.hasProperty('foo')).toBe(true);
    expect(BasicModel.create({foo: 'hello'}).foo()).toBe('hello');
    expect(BasicModel.create({foo: 'goodbye'}).get('foo')).toBe('goodbye');
  });

  describe('`string` type', function() {
    var x;

    beforeEach(function() { x = BasicModel.create(); });

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

    beforeEach(function() { x = BasicModel.create(); });

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
      var m = BasicModel.load({ id: 126, foo: 's', bar: 1 });

      expect(m.type()).toBe(BasicModel);
      expect(m.id()).toBe(126);
      expect(m.foo()).toBe('s');
      expect(m.bar()).toBe(1);
    });

    it('should add the new model instance to the identity map', function() {
      var m = BasicModel.load({ id: 127, foo: 's', bar: 1 });

      expect(BasicModel.fetch(127)).toBe(m);
    });

    it('should unset all of the state bits', function() {
      var m = BasicModel.load({ id: 128, foo: 's', bar: 1 }), state = m.state();

      expect(state & Z.Model.NEW).toBeFalsy();
      expect(state & Z.Model.DIRTY).toBeFalsy();
      expect(state & Z.Model.INVALID).toBeFalsy();
      expect(state & Z.Model.BUSY).toBeFalsy();
      expect(state & Z.Model.DESTROYED).toBeFalsy();
    });
  });

  describe('given attributes containing an id that is in the identity map', function() {
    it('should update and return the object that is already in the identity map', function() {
      var m = BasicModel.load({ id: 200, foo: 's', bar: 1 });

      BasicModel.load({ id: 200, foo: 's2', bar: 2 });

      expect(m.foo()).toBe('s2');
      expect(m.bar()).toBe(2);
    });

    it('should unset all of the state bits', function() {
      var m = BasicModel.load({ id: 201, foo: 's', bar: 1 }), state;

      m.foo('x');

      expect(m.state() & Z.Model.DIRTY).toBeTruthy();

      BasicModel.load({ id: 201, foo: 's3', bar: 3 });
      
      state = m.state();

      expect(state & Z.Model.NEW).toBeFalsy();
      expect(state & Z.Model.DIRTY).toBeFalsy();
      expect(state & Z.Model.INVALID).toBeFalsy();
      expect(state & Z.Model.BUSY).toBeFalsy();
      expect(state & Z.Model.DESTROYED).toBeFalsy();
    });
  });

  describe('given attributes that do not include an id', function() {
    it('should throw an exception', function() {
      expect(function() {
        BasicModel.load({ foo: 's', bar: 1 });
      }).toThrow('Z.Model.load: an `id` attribute is required');
    });
  });
});

describe('Z.Model.initialize', function() {
  it('should set the given attributes', function() {
    var m = BasicModel.create({ foo: 'abc', bar: 1 });

    expect(m.foo()).toBe('abc');
    expect(m.get('bar')).toBe(1);
  });

  it('should set the NEW state bit', function() {
    var m = BasicModel.create({ foo: 'abc', bar: 1 }), state = m.state();

    expect(state & Z.Model.NEW).toBeTruthy();
    expect(state & Z.Model.DIRTY).toBeFalsy();
    expect(state & Z.Model.INVALID).toBeFalsy();
    expect(state & Z.Model.BUSY).toBeFalsy();
    expect(state & Z.Model.DESTROYED).toBeFalsy();
  });
});

describe('Z.Model id property', function() {
  it('should throw an exception when setting it when it already has a non-null value', function() {
    var m = BasicModel.create({ id: 1 });

    expect(m.id()).toBe(1);
    expect(function() {
      m.id(9);
    }).toThrow("Z.Model.id (setter): overwriting a model's identity is not allowed: " + m.toString());
    expect(m.id()).toBe(1);
  });

  it('should add the model to the identity map once its been set for the firs time', function() {
    var m = BasicModel.create();

    m.set('id', 8734);
    expect(BasicModel.fetch(8734)).toBe(m);
  });
});

describe('Z.Model.fetch', function() {
  beforeEach(function() {
    spyOn(BasicModel.mapper, 'fetchModel');
    Z.Model.clearIdentityMap();
  });

  describe('for an id of a model that is already loaded into the identity map', function() {
    it('should return a reference to the already existing object', function() {
      var m = BasicModel.load({id: 1234, foo: 'a', bar: 2});

      expect(BasicModel.fetch(1234)).toBe(m);
    });
  });

  describe('for an id of a model that is not in the identity map', function() {
    beforeEach(function() { Z.Model.clearIdentityMap(); });

    it("should invoke the `fetchModel` method on the type's mapper", function() {
      var m = BasicModel.fetch(18);
      expect(BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
    });

    it('should return an instance of the model with the BUSY state bit set', function() {
      var m = BasicModel.fetch(19), state = m.state();

      expect(m.type()).toBe(BasicModel);
      expect(m.id()).toBe(19);
      expect(state & Z.Model.NEW).toBeFalsy();
      expect(state & Z.Model.DIRTY).toBeFalsy();
      expect(state & Z.Model.INVALID).toBeFalsy();
      expect(state & Z.Model.BUSY).toBeTruthy();
      expect(state & Z.Model.DESTROYED).toBeFalsy();
    });

    it('should add the instance to the identity map', function() {
      var m = BasicModel.fetch(20);
      expect(BasicModel.fetch(20)).toBe(m);
    });
  });
});

describe('Z.Model.fetchModelDidSucceed', function() {
  it('should unset the BUSY state bit', function() {
    var m = BasicModel.fetch(22);

    expect(m.state() & Z.Model.BUSY).toBeTruthy();
    m.fetchModelDidSucceed();
    expect(m.state() & Z.Model.BUSY).toBeFalsy();
  });
});

describe('Z.Model.fetchModelDidFail', function() {
  beforeEach(function() { Z.Model.clearIdentityMap(); });

  it('should unset the BUSY state bit', function() {
    var m;

    spyOn(BasicModel.mapper, 'fetchModel');

    m = BasicModel.fetch(1);

    expect(m.state() & Z.Model.BUSY).toBeTruthy();
    m.fetchModelDidFail();
    expect(m.state() & Z.Model.BUSY).toBeFalsy();
  });
});

describe('Z.Model setting attributes', function() {
  describe('for a NEW model', function() {
    it('should not set the DIRTY state bit', function() {
      var m = BasicModel.create();

      expect(m.state() & Z.Model.NEW).toBeTruthy();
      expect(m.state() & Z.Model.DIRTY).toBeFalsy();
      m.set('foo', 'hello');
      expect(m.state() & Z.Model.NEW).toBeTruthy();
      expect(m.state() & Z.Model.DIRTY).toBeFalsy();
    });

    it('should not create the `changes` hash', function() {
      var m = BasicModel.create();
      expect(m.get('changes')).toBeUndefined();
      m.set('bar', 9);
      expect(m.get('changes')).toBeUndefined();
    });
  });

  describe('for a LOADED model', function() {
    it('should set the DIRTY state bit', function() {
      var m = BasicModel.load({id: 121});

      expect(m.state() & Z.Model.NEW).toBeFalsy();
      expect(m.state() & Z.Model.DIRTY).toBeFalsy();
      m.set('foo', 'hello');
      expect(m.state() & Z.Model.NEW).toBeFalsy();
      expect(m.state() & Z.Model.DIRTY).toBeTruthy();
    });

    it("should create the `changes` hash containing the changed attribute's previous value", function() {
      var m = BasicModel.load({id: 123, bar: 8});

      expect(m.get('changes')).toBeUndefined();
      m.set('bar', 9);
      expect(m.get('changes')).not.toBeUndefined();
      expect(m.get('changes').type()).toBe(Z.Hash);
      expect(m.get('changes.bar')).toBe(8);
    });

    it('should only add the attribute to the `changes` hash if it has yet to be changed', function() {
      var m = BasicModel.load({id: 123, foo: 'a', bar: 8});

      m.set('foo', 'b');
      expect(m.get('changes.foo')).toBe('a');
      m.set('foo', 'c');
      expect(m.get('changes.foo')).toBe('a');

      m.set('bar', 9);
      expect(m.get('changes.bar')).toBe(8);
      m.set('bar', 10);
      expect(m.get('changes.bar')).toBe(8);
    });
  });
});

describe('Z.Model.save', function() {
  beforeEach(function() {
    Z.Model.clearIdentityMap();
    spyOn(Z.Model.mapper, 'createModel');
    spyOn(Z.Model.mapper, 'updateModel');
  });

  describe('for an object with the NEW state bit set', function() {
    it("should invoke the `createModel` method on type's mapper", function() {
      var m = BasicModel.create({id: 1, foo: 'x', bar: 9 });

      expect(m.state() & Z.Model.NEW).toBeTruthy();
      m.save();
      expect(BasicModel.mapper.createModel).toHaveBeenCalledWith(m);
      expect(BasicModel.mapper.updateModel).not.toHaveBeenCalled();
    });
  });

  describe('for an object with the DIRTY state bit set', function() {
    it("should invoke the `updateModel` method on type's mapper", function() {
      var m = BasicModel.load({id: 1, foo: 'x', bar: 9 });

      m.foo('y');
      expect(m.state() & Z.Model.DIRTY).toBeTruthy();
      m.save();
      expect(BasicModel.mapper.createModel).not.toHaveBeenCalled();
      expect(BasicModel.mapper.updateModel).toHaveBeenCalledWith(m);
    });
  });

  describe('for a model instance that is not NEW or DIRTY', function() {
    it("should do nothing", function() {
      var m = BasicModel.load({id: 1, foo: 'x', bar: 9 }), state = m.state();

      expect(state & Z.Model.NEW).toBeFalsy();
      expect(state & Z.Model.DIRTY).toBeFalsy();
      m.save();
      expect(BasicModel.mapper.createModel).not.toHaveBeenCalled();
      expect(BasicModel.mapper.updateModel).not.toHaveBeenCalled();
    });
  });

  describe('for a model that has its INVALID state bit set', function() {
    it("should do nothing", function() {
      var m = ValidatedModel.load({id: 1, foo: 'x', bar: 22 });

      m.set('bar', 1);
      m.validate();
      expect(m.state() & Z.Model.INVALID).toBeTruthy();
      m.save();

      expect(BasicModel.mapper.createModel).not.toHaveBeenCalled();
      expect(BasicModel.mapper.updateModel).not.toHaveBeenCalled();
    });
  });

  describe('for a model that has its BUSY state bit set', function() {
    it('should throw an exception', function() {
      var m = BasicModel.load({id: 1, foo: 'x'});

      m.foo('y');
      m.save();

      expect(m.state() & Z.Model.BUSY).toBeTruthy();

      expect(function() {
        m.save();
      }).toThrow('Z.Model.save: attempted to save a BUSY model');
    });
  });

  describe('for a model that has its DESTROYED state bit set', function() {
    it('should throw an exception', function() {
      var m = BasicModel.load({id: 1, foo: 'x', bar: 2});

      spyOn(BasicModel.mapper, 'destroyModel');
      m.destroy();
      m.destroyModelDidSucceed(1);

      expect(m.state() & Z.Model.DESTROYED).toBeTruthy();

      expect(function() {
        m.save();
      }).toThrow('Z.Model.save: attempted to save a DESTROYED model');
    });
  });
});

describe('Z.Model.createModelDidSucceed', function() {
  it('should unset the NEW and BUSY state bits', function() {
    var m = BasicModel.create({foo: 'x', bar: 2});

    m.save();
    expect(m.state() & Z.Model.NEW).toBeTruthy();
    expect(m.state() & Z.Model.BUSY).toBeTruthy();
    m.createModelDidSucceed();
    expect(m.state() & Z.Model.NEW).toBeFalsy();
    expect(m.state() & Z.Model.BUSY).toBeFalsy();
  });
});

describe('Z.Model.createModelDidFail', function() {
  it('should unset the BUSY state bit', function() {
    var m = BasicModel.create({foo: 'x', bar: 2});

    m.save();
    expect(m.state() & Z.Model.NEW).toBeTruthy();
    expect(m.state() & Z.Model.BUSY).toBeTruthy();
    m.createModelDidFail();
    expect(m.state() & Z.Model.NEW).toBeTruthy();
    expect(m.state() & Z.Model.BUSY).toBeFalsy();
  });
});

describe('Z.Model.updateModelDidSucceed', function() {
  it('should unset the DIRTY and BUSY state bits', function() {
    var m = BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.save();

    expect(m.state() & Z.Model.DIRTY).toBeTruthy();
    expect(m.state() & Z.Model.BUSY).toBeTruthy();
    m.updateModelDidSucceed();
    expect(m.state() & Z.Model.DIRTY).toBeFalsy();
    expect(m.state() & Z.Model.BUSY).toBeFalsy();
  });

  it('should clear the `changes` hash', function() {
    var m = BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.set('bar', 3);
    m.save();

    expect(m.get('changes.size')).toBe(2);
    m.updateModelDidSucceed();
    expect(m.get('changes.size')).toBe(0);
  });
});

describe('Z.Model.updateModelDidFail', function() {
  it('should unset the BUSY state bit', function() {
    var m = BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.save();

    expect(m.state() & Z.Model.DIRTY).toBeTruthy();
    expect(m.state() & Z.Model.BUSY).toBeTruthy();
    m.updateModelDidFail();
    expect(m.state() & Z.Model.DIRTY).toBeTruthy();
    expect(m.state() & Z.Model.BUSY).toBeFalsy();
  });

  it('should not clear the `changes` hash', function() {
    var m = BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.set('bar', 3);
    m.save();

    expect(m.get('changes.size')).toBe(2);
    m.updateModelDidFail();
    expect(m.get('changes.size')).toBe(2);
  });
});

describe('Z.Model.undoChanges', function() {
  beforeEach(function() { Z.Model.clearIdentityMap(); });

  describe('on a NEW model', function() {
    it('should do nothing', function() {
      var m = BasicModel.create({foo: 'v', bar: 12});

      m.undoChanges();
      expect(m.state() & Z.Model.NEW).toBeTruthy();
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });
  });

  describe('on a CLEAN model', function() {
    it('should do nothing', function() {
      var m = BasicModel.load({id: 5, foo: 'v', bar: 12});

      m.undoChanges();
      expect(m.state() & Z.Model.DIRTY).toBeFalsy();
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });
  });

  describe('on a DESTROYED model', function() {
    it('throw an exception', function() {
      var m = BasicModel.load({id: 5, foo: 'v', bar: 12});

      m.destroy().destroyModelDidSucceed();

      expect(m.state() & Z.Model.DESTROYED).toBeTruthy();

      expect(function() {
        m.undoChanges();
      }).toThrow("Z.Model.undoChanges: attempted to undo changes on a DESTROYED model: " + m.toString());
    });
  });

  describe('on a DIRTY model', function() {
    var m;

    beforeEach(function() {
      m = BasicModel.load({id: 5, foo: 'v', bar: 12});
      m.foo('x');
      m.bar(21);
    });

    it('should set all attribute values back to their CLEAN state', function() {
      m.undoChanges();
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });

    it('should clear the `changes` hash', function() {
      expect(m.get('changes.size')).toBe(2);
      m.undoChanges();
      expect(m.get('changes.size')).toBe(0);
    });

    it('should unset the DIRTY state bit', function() {
      expect(m.state() & Z.Model.DIRTY).toBeTruthy();
      m.undoChanges();
      expect(m.state() & Z.Model.DIRTY).toBeFalsy();
    });
  });
});

describe('Z.Model.addError', function() {
  var m;

  beforeEach(function() {
    Z.Model.clearIdentityMap();
    m = ValidatedModel.load({id: 9, foo: 'hey', bar: 99});
  });

  it("should create the `errors` hash if it doesn't exist", function() {
    expect(m.errors()).toBeUndefined();
    m.addError('foo', 'blah');
    expect(m.errors()).not.toBeUndefined();
  });

  it("should push the given message onto an array keyed by the given attribute name", function() {
    m.addError('foo', 'blah');
    expect(m.errors().at('foo')).toEq(Z.A('blah'));
    m.addError('foo', 'something');
    expect(m.errors().at('foo')).toEq(Z.A('blah', 'something'));
  });

  it('should set the INVALID state bit', function() {
    expect(m.state() & Z.Model.INVALID).toBeFalsy();
    m.addError('foo', 'this is an error');
    expect(m.state() & Z.Model.INVALID).toBeTruthy();
  });
});

describe('Z.Model.validate', function() {
  var m, inlineValidatorRan, inlineValidatorThis;

  ValidatedModel.open(function() {
    this.registerValidator(function() {
      inlineValidatorRan  = true;
      inlineValidatorThis = this;
    });
  });

  beforeEach(function() {
    Z.Model.clearIdentityMap();
    m = ValidatedModel.load({id: 4, foo: 'xyz', bar: 76});
    inlineValidatorRan  = false;
    inlineValidatorThis = null;
  });

  it('should run all registered validators', function() {
    spyOn(m, 'validatePresenceOfFoo');
    spyOn(m, 'validateBarIsOver20');

    m.validate();

    expect(m.validatePresenceOfFoo).toHaveBeenCalled();
    expect(m.validateBarIsOver20).toHaveBeenCalled();
    expect(inlineValidatorRan).toBe(true);
    expect(inlineValidatorThis).toBe(m);
  });

  it('should set the INVALID state bit if any validators add an error to the `errors` hash', function() {
    expect(m.state() & Z.Model.INVALID).toBeFalsy();
    m.validate();
    expect(m.errors()).toBeUndefined();
    expect(m.state() & Z.Model.INVALID).toBeFalsy();
    m.foo(null);
    m.validate();
    expect(m.errors().size()).toBe(1);
    expect(m.state() & Z.Model.INVALID).toBeTruthy();
    m.bar(8);
    m.validate();
    expect(m.errors().size()).toBe(2);
    expect(m.state() & Z.Model.INVALID).toBeTruthy();
  });

  it('should unset the INVALID state bit if all validators do not add to the `errors` hash', function() {
    m.foo(null);
    m.bar(8);

    m.validate();
    expect(m.errors().size()).toBe(2);
    expect(m.state() & Z.Model.INVALID).toBeTruthy();

    m.foo('a');
    m.bar(21);
    m.validate();
    expect(m.errors().size()).toBe(0);
    expect(m.state() & Z.Model.INVALID).toBeFalsy();
  });
});

describe('Z.Model.clearIdentityMap', function() {
  it('should remove all objects from the identity map', function() {
    var m = BasicModel.create({id: 1111});

    expect(BasicModel.fetch(1111)).toBe(m);
    Z.Model.clearIdentityMap();
    expect(BasicModel.fetch(1111)).not.toBe(m);
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

    it('should include the `id` property', function() {
      var x = X.load({id: 19, foo: 'abc', bar: 22});
      expect(x.toJSON()).toEqual({id: 19, foo: 'abc', bar: 22});
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
