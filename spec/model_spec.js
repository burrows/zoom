(function() {

if (typeof Z === 'undefined') { require('./helper'); }

beforeEach(function() { Z.Model.clearIdentityMap(); });

Test.BasicModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
});

Test.ValidatedModel = Z.Model.extend(function() {
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
    expect(Test.BasicModel.hasProperty('foo')).toBe(true);
    expect(Test.BasicModel.create({foo: 'hello'}).foo()).toBe('hello');
    expect(Test.BasicModel.create({foo: 'goodbye'}).get('foo')).toBe('goodbye');
  });

  describe('`string` type', function() {
    var x;

    beforeEach(function() { x = Test.BasicModel.create(); });

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

    beforeEach(function() { x = Test.BasicModel.create(); });

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

describe('Z.Model.empty', function() {
  it('should return an instance of the model with `sourceState` set to `EMPTY` and the given id', function() {
    var m = Test.BasicModel.empty(127);

    expect(m.id()).toBe(127);
    expect(m.sourceState()).toBe(Z.Model.EMPTY);
    expect(m.isBusy()).toBe(false);
  });

  it('should throw an exception if an instance with the given id already exists in the identity map', function() {
    var m = Test.BasicModel.load({id: 128});

    expect(function() {
      Test.BasicModel.empty(128);
    }).toThrow('Z.Model.empty: an instance of `Test.BasicModel` with the id `128` already exists');
  });
});

describe('Z.Model.load', function() {
  describe('given attributes containing an id not in the identity map', function() {
    it('should return a new model instance with the given attributes', function() {
      var m = Test.BasicModel.load({ id: 126, foo: 's', bar: 1 });

      expect(m.type()).toBe(Test.BasicModel);
      expect(m.id()).toBe(126);
      expect(m.foo()).toBe('s');
      expect(m.bar()).toBe(1);
    });

    it('should add the new model instance to the identity map', function() {
      var m = Test.BasicModel.load({ id: 127, foo: 's', bar: 1 });

      expect(Test.BasicModel.fetch(127)).toBe(m);
    });

    it('should set `sourceState` to `LOADED`', function() {
      var m = Test.BasicModel.load({ id: 128, foo: 's', bar: 1 });
      expect(m.sourceState()).toBe(Z.Model.LOADED);
    });

    it('should set `isDirty`, `isInvalid`, and `isBusy` to `false`', function() {
      var m = Test.BasicModel.load({ id: 128, foo: 's', bar: 1 });
      expect(m.isDirty()).toBe(false);
      expect(m.isInvalid()).toBe(false);
      expect(m.isBusy()).toBe(false);
    });
  });

  describe('given attributes containing an id that is in the identity map', function() {
    it('should update and return the object that is already in the identity map', function() {
      var m = Test.BasicModel.load({ id: 200, foo: 's', bar: 1 });

      Test.BasicModel.load({ id: 200, foo: 's2', bar: 2 });

      expect(m.foo()).toBe('s2');
      expect(m.bar()).toBe(2);
    });

    it('should set the state to `LOADED`', function() {
      var m = Test.BasicModel.load({ id: 201, foo: 's', bar: 1 });

      m.foo('x');

      expect(m.isDirty()).toBe(true);

      Test.BasicModel.load({ id: 201, foo: 's3', bar: 3 });

      expect(m.sourceState()).toBe(Z.Model.LOADED);
      expect(m.isDirty()).toBe(false);
      expect(m.isInvalid()).toBe(false);
      expect(m.isBusy()).toBe(false);
    });
  });

  describe('given attributes that do not include an id', function() {
    it('should throw an exception', function() {
      expect(function() {
        Test.BasicModel.load({ foo: 's', bar: 1 });
      }).toThrow('Z.Model.load: an `id` attribute is required');
    });
  });
});

describe('Z.Model.initialize', function() {
  it('should set the given attributes', function() {
    var m = Test.BasicModel.create({ foo: 'abc', bar: 1 });

    expect(m.foo()).toBe('abc');
    expect(m.get('bar')).toBe(1);
  });

  it('should set `sourceState` to `NEW`', function() {
    var m = Test.BasicModel.create({ foo: 'abc', bar: 1 });

    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isDirty()).toBe(false);
    expect(m.isInvalid()).toBe(false);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model id property', function() {
  it('should throw an exception when setting it when it already has a non-null value', function() {
    var m = Test.BasicModel.create({ id: 1 });

    expect(m.id()).toBe(1);
    expect(function() {
      m.id(9);
    }).toThrow("Z.Model.id (setter): overwriting a model's identity is not allowed: " + m.toString());
    expect(m.id()).toBe(1);
  });

  it('should add the model to the identity map once its been set for the first time', function() {
    var m = Test.BasicModel.create();

    m.set('id', 8734);
    expect(Test.BasicModel.fetch(8734)).toBe(m);
  });
});

describe('Z.Model.fetch', function() {
  beforeEach(function() {
    spyOn(Test.BasicModel.mapper, 'fetchModel');
  });

  describe('for an id of a model that is already loaded into the identity map', function() {
    it('should return a reference to the already existing object', function() {
      var m = Test.BasicModel.load({id: 1234, foo: 'a', bar: 2});

      expect(Test.BasicModel.fetch(1234)).toBe(m);
    });
  });

  describe('for an id of a model that is not in the identity map', function() {
    it("should invoke the `fetchModel` method on the type's mapper", function() {
      var m = Test.BasicModel.fetch(18);
      expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
    });

    it('should return an instance of the model with `sourceState` set to `EMPTY` and `isBusy` set to `true`', function() {
      var m = Test.BasicModel.fetch(19);

      expect(m.type()).toBe(Test.BasicModel);
      expect(m.id()).toBe(19);

      expect(m.sourceState()).toBe(Z.Model.EMPTY);
      expect(m.isDirty()).toBe(false);
      expect(m.isInvalid()).toBe(false);
      expect(m.isBusy()).toBe(true);
    });

    it('should add the instance to the identity map', function() {
      var m = Test.BasicModel.fetch(20);
      expect(Test.BasicModel.fetch(20)).toBe(m);
    });
  });
});

describe('Z.Model.fetchModelDidSucceed', function() {
  it('should set `sourceState` to `LOADED`', function() {
    var m = Test.BasicModel.fetch(22);

    expect(m.sourceState()).toBe(Z.Model.EMPTY);
    m.fetchModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
  });

  it('should set `isBusy` to `false`', function() {
    var m = Test.BasicModel.fetch(22);

    expect(m.isBusy()).toBe(true);
    m.fetchModelDidSucceed();
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.fetchModelDidFail', function() {
  it('should set `isBusy` to `false`', function() {
    var m;

    spyOn(Test.BasicModel.mapper, 'fetchModel');

    m = Test.BasicModel.fetch(1);

    expect(m.isBusy()).toBe(true);
    m.fetchModelDidFail();
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.refresh', function() {
  var m;

  beforeEach(function() {
    spyOn(Test.BasicModel.mapper, 'fetchModel');
    m = Test.BasicModel.load({id: 34});
  });

  it("should invoke the mapper's `fetchModel` method", function() {
    m.refresh();
    expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
  });

  it("should return the receiver", function() {
    expect(m.refresh()).toBe(m);
  });

  it("should set `isBusy` to `true`", function() {
    expect(m.isBusy()).toBe(false);
    m.refresh();
    expect(m.isBusy()).toBe(true);
  });

  it('should throw an exception when called on a `NEW` model', function() {
    m = Test.BasicModel.create();

    expect(function() {
      m.refresh();
    }).toThrow("Test.BasicModel.refresh: can't refresh a model in the NEW state: " + m.toString());
  });

  it('should throw an exception when called on an `BUSY` model', function() {
    m.refresh();
    expect(m.isBusy()).toBe(true);

    expect(function() {
      m.refresh();
    }).toThrow("Test.BasicModel.refresh: can't refresh a model in the LOADED-BUSY state: " + m.toString());
  });

  it('should throw an exception when called on a `DESTROYED` model', function() {
    m.destroy().destroyModelDidSucceed();
    expect(function() {
      m.refresh();
    }).toThrow("Test.BasicModel.refresh: can't refresh a model in the DESTROYED state: " + m.toString());
  });
});

describe('Z.Model getting attributes', function() {
  beforeEach(function() {
    spyOn(Test.BasicModel.mapper, 'fetchModel');
  });

  describe('for an `EMPTY` model', function() {
    it('should invoke `fetchModel` on the mapper', function() {
      var m = Test.BasicModel.empty(945);

      m.foo();
      expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
    });

    it('should set `isBusy` to `true`', function() {
      var m = Test.BasicModel.empty(945);
      expect(m.isBusy()).toBe(false);
      m.foo();
      expect(m.isBusy()).toBe(true);
    });
  });
});

describe('Z.Model setting attributes', function() {
  it('should throw an exception for a model that is `EMPTY`', function() {
    var m = Test.BasicModel.empty(222);

    expect(function() {
      m.set('foo', 'abc');
    }).toThrow("Test.BasicModel attribute setter: can't set attributes on a model in the EMPTY state: " + m.toString());
  });

  it('should throw an exception for a model that is `BUSY`', function() {
    var m = Test.BasicModel.load({id: 1});

    m.refresh();
    expect(m.isBusy()).toBe(true);
    expect(function() {
      m.foo('x');
    }).toThrow("Test.BasicModel attribute setter: can't set attributes on a model in the LOADED-BUSY state: " + m.toString());
  });

  describe('for a `NEW` model', function() {
    it('should not set `isDirty`', function() {
      var m = Test.BasicModel.create();

      expect(m.sourceState()).toBe(Z.Model.NEW);
      expect(m.isDirty()).toBe(false);
      m.set('foo', 'hello');
      expect(m.sourceState()).toBe(Z.Model.NEW);
      expect(m.isDirty()).toBe(false);
    });

    it('should not create the `changes` hash', function() {
      var m = Test.BasicModel.create();
      expect(m.get('changes')).toBeUndefined();
      m.set('bar', 9);
      expect(m.get('changes')).toBeUndefined();
    });
  });

  describe('for a `LOADED` model', function() {
    it('should set `isDirty`', function() {
      var m = Test.BasicModel.load({id: 121});

      expect(m.sourceState()).toBe(Z.Model.LOADED);
      expect(m.isDirty()).toBe(false);
      m.set('foo', 'hello');
      expect(m.sourceState()).toBe(Z.Model.LOADED);
      expect(m.isDirty()).toBe(true);
    });

    it("should create the `changes` hash containing the changed attribute's previous value", function() {
      var m = Test.BasicModel.load({id: 123, bar: 8});

      expect(m.get('changes')).toBeUndefined();
      m.set('bar', 9);
      expect(m.get('changes')).not.toBeUndefined();
      expect(m.get('changes').type()).toBe(Z.Hash);
      expect(m.get('changes.bar')).toBe(8);
    });

    it('should only add the attribute to the `changes` hash if it has yet to be changed', function() {
      var m = Test.BasicModel.load({id: 123, foo: 'a', bar: 8});

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
    spyOn(Z.Model.mapper, 'createModel');
    spyOn(Z.Model.mapper, 'updateModel');
  });

  it("should invoke the mapper's `createModel` method when the model state is `NEW`", function() {
    var m = Test.BasicModel.create({id: 1, foo: 'x', bar: 9 });

    expect(m.sourceState()).toBe(Z.Model.NEW);
    m.save();
    expect(Test.BasicModel.mapper.createModel).toHaveBeenCalledWith(m);
    expect(Test.BasicModel.mapper.updateModel).not.toHaveBeenCalled();
  });

  it("should invoke the mapper's `updateModel` method when the model is `DIRTY`", function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x', bar: 9 });

    m.foo('y');
    expect(m.isDirty()).toBe(true);
    m.save();
    expect(Test.BasicModel.mapper.createModel).not.toHaveBeenCalled();
    expect(Test.BasicModel.mapper.updateModel).toHaveBeenCalledWith(m);
  });

  it("should do nothing for a model that is `LOADED` and `isDirty` is false", function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x', bar: 9 });

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(false);
    m.save();
    expect(Test.BasicModel.mapper.createModel).not.toHaveBeenCalled();
    expect(Test.BasicModel.mapper.updateModel).not.toHaveBeenCalled();
  });

  it("should do nothing for a model that is invalid", function() {
    var m = Test.ValidatedModel.load({id: 1, foo: 'x', bar: 22 });

    m.set('bar', 1);
    expect(m.isInvalid()).toBe(false);
    m.save();
    expect(m.isInvalid()).toBe(true);

    expect(Test.BasicModel.mapper.createModel).not.toHaveBeenCalled();
    expect(Test.BasicModel.mapper.updateModel).not.toHaveBeenCalled();
  });

  it('should throw an exception for a model that is `BUSY`', function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x'});

    m.foo('y');
    m.save();

    expect(m.isBusy()).toBe(true);

    expect(function() {
      m.save();
    }).toThrow("Test.BasicModel.save: can't save a model in the LOADED-DIRTY-BUSY state: " + m.toString());
  });

  it('should throw an exception for a model that is `DESTROYED`', function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x', bar: 2});

    m.destroy().destroyModelDidSucceed(1);
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);

    expect(function() {
      m.save();
    }).toThrow("Test.BasicModel.save: can't save a model in the DESTROYED state: " + m.toString());
  });

  it('should throw an exception for a model that is `EMPTY`', function() {
    var m = Test.BasicModel.empty(88);

    expect(function() {
      m.save();
    }).toThrow("Test.BasicModel.save: can't save a model in the EMPTY state: " + m.toString());
  });
});

describe('Z.Model.createModelDidSucceed', function() {
  it('should set `sourceState` to `LOADED` and `isBusy` to `false`', function() {
    var m = Test.BasicModel.create({foo: 'x', bar: 2});

    m.save();
    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isBusy()).toBe(true);
    m.createModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.createModelDidFail', function() {
  it('should `isBusy` to `false`', function() {
    var m = Test.BasicModel.create({foo: 'x', bar: 2});

    m.save();
    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isBusy()).toBe(true);
    m.createModelDidFail();
    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.updateModelDidSucceed', function() {
  it('should set `isDirty` and `isBusy` to `false`', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.save();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.updateModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(false);
    expect(m.isBusy()).toBe(false);
  });

  it('should clear the `changes` hash', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.set('bar', 3);
    m.save();

    expect(m.get('changes.size')).toBe(2);
    m.updateModelDidSucceed();
    expect(m.get('changes.size')).toBe(0);
  });
});

describe('Z.Model.updateModelDidFail', function() {
  it('should set `isBusy` to `false`', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.save();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.updateModelDidFail();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isBusy()).toBe(false);
  });

  it('should not clear the `changes` hash', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.set('bar', 3);
    m.save();

    expect(m.get('changes.size')).toBe(2);
    m.updateModelDidFail();
    expect(m.get('changes.size')).toBe(2);
  });
});

describe('Z.Model.destroy', function() {
  var m;

  beforeEach(function() {
    m = Test.BasicModel.load({id: 144});
    spyOn(Test.BasicModel.mapper, 'destroyModel');
  });

  it("should invoke the mapper's `destroyModel` method", function() {
    m.destroy();
    expect(m.mapper.destroyModel).toHaveBeenCalledWith(m);
  });

  it('should set `isBusy` to `true`', function() {
    expect(m.isBusy()).toBe(false);
    m.destroy();
    expect(m.isBusy()).toBe(true);
  });

  it('should work when the model state is `EMPTY`', function() {
    m = Test.BasicModel.empty(447);

    m.destroy();

    expect(m.mapper.destroyModel).toHaveBeenCalledWith(m);
    expect(m.isBusy()).toBe(true);
  });

  it('should not invoke the mapper `destroyModel` method when the model state is `NEW`', function() {
    m = Test.BasicModel.create();

    m.destroy();

    expect(m.mapper.destroyModel).not.toHaveBeenCalled();
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isBusy()).toBe(false);
  });

  it('should do nothing when the model state is `DESTROYED`', function() {
    m.destroy().destroyModelDidSucceed();

    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isBusy()).toBe(false);

    m.destroy();

    expect(m.mapper.destroyModel.callCount).toBe(1);
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isBusy()).toBe(false);
  });

  it('should throw an exception when the model is `BUSY`', function() {
    m.refresh();

    expect(m.isBusy()).toBe(true);

    expect(function() {
      m.destroy();
    }).toThrow("Test.BasicModel.destroy: can't destroy a model in the LOADED-BUSY state: " + m.toString());
  });
});

describe('Z.Model.destroyModelDidSucceed', function() {
  it('should set the state to `DESTROYED` and clear `isDirty`, `isBusy` and `isInvalid`', function() {
    var m = Test.ValidatedModel.load({id: 144, foo: 'hey', bar: 222});

    m.bar(9);
    m.validate();
    m.destroy();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isInvalid()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.destroyModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isDirty()).toBe(false);
    expect(m.isInvalid()).toBe(false);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.destroyModelDidFail', function() {
  it('should not change the state and clear `isBusy`', function() {
    var m = Test.ValidatedModel.load({id: 144, foo: 'hey', bar: 222});

    m.bar(9);
    m.validate();
    m.destroy();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isInvalid()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.destroyModelDidFail();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isInvalid()).toBe(true);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.undoChanges', function() {
  describe('on a new model', function() {
    it('should do nothing', function() {
      var m = Test.BasicModel.create({foo: 'v', bar: 12});

      m.undoChanges();
      expect(m.sourceState()).toBe(Z.Model.NEW);
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });
  });

  describe('on a clean model', function() {
    it('should do nothing', function() {
      var m = Test.BasicModel.load({id: 5, foo: 'v', bar: 12});

      m.undoChanges();
      expect(m.isDirty()).toBe(false);
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });
  });

  describe('on a destroyed model', function() {
    it('throw an exception', function() {
      var m = Test.BasicModel.load({id: 5, foo: 'v', bar: 12});

      m.destroy().destroyModelDidSucceed();

      expect(m.sourceState()).toBe(Z.Model.DESTROYED);

      expect(function() {
        m.undoChanges();
      }).toThrow("Z.Model.undoChanges: attempted to undo changes on a DESTROYED model: " + m.toString());
    });
  });

  describe('on a dirty model', function() {
    var m;

    beforeEach(function() {
      m = Test.BasicModel.load({id: 5, foo: 'v', bar: 12});
      m.foo('x');
      m.bar(21);
    });

    it('should set all attribute values back to their original state', function() {
      m.undoChanges();
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });

    it('should clear the `changes` hash', function() {
      expect(m.get('changes.size')).toBe(2);
      m.undoChanges();
      expect(m.get('changes.size')).toBe(0);
    });

    it('should set `isDirty` to `false`', function() {
      expect(m.isDirty()).toBe(true);
      m.undoChanges();
      expect(m.isDirty()).toBe(false);
    });
  });
});

describe('Z.Model.addError', function() {
  var m;

  beforeEach(function() {
    m = Test.ValidatedModel.load({id: 9, foo: 'hey', bar: 99});
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

  it('should set `isInvalid` to `true`', function() {
    expect(m.isInvalid()).toBe(false);
    m.addError('foo', 'this is an error');
    expect(m.isInvalid()).toBe(true);
  });
});

describe('Z.Model.validate', function() {
  var m, inlineValidatorRan, inlineValidatorThis;

  Test.ValidatedModel.open(function() {
    this.registerValidator(function() {
      inlineValidatorRan  = true;
      inlineValidatorThis = this;
    });
  });

  beforeEach(function() {
    m = Test.ValidatedModel.load({id: 4, foo: 'xyz', bar: 76});
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

  it('should set `isInvalid` if any validators add an error to the `errors` hash', function() {
    expect(m.isInvalid()).toBe(false);
    m.validate();
    expect(m.errors()).toBeUndefined();
    expect(m.isInvalid()).toBe(false);
    m.foo(null);
    m.validate();
    expect(m.errors().size()).toBe(1);
    expect(m.isInvalid()).toBe(true);
    m.bar(8);
    m.validate();
    expect(m.errors().size()).toBe(2);
    expect(m.isInvalid()).toBe(true);
  });

  it('should unset `isInvalid` if none of the validators add to the `errors` hash', function() {
    m.foo(null);
    m.bar(8);

    m.validate();
    expect(m.errors().size()).toBe(2);
    expect(m.isInvalid()).toBe(true);

    m.foo('a');
    m.bar(21);
    m.validate();
    expect(m.errors().size()).toBe(0);
    expect(m.isInvalid()).toBe(false);
  });

  describe('with conditional validators', function() {
    var A = Z.Model.extend(function() {
      this.registerValidator('validatorA', { 'if': 'shouldValidate'});
      this.registerValidator('validatorB', { unless: function() {
        return this.shouldntValidate();
      }});

      this.property('shouldValidate');
      this.property('shouldntValidate');
      this.attribute('foo', 'integer');

      this.def('validatorA', function() {});
      this.def('validatorB', function() {});
    });

    it('should run an `if` validator if the given method returns a truthy value', function() {
      var m = A.create();

      spyOn(m, 'validatorA');

      m.shouldValidate(true);
      m.validate();
      expect(m.validatorA).toHaveBeenCalled();
    });

    it('should not run an `if` validator if the given method returns a falsy value', function() {
      var m = A.create();

      spyOn(m, 'validatorA');

      m.shouldValidate(false);
      m.validate();
      expect(m.validatorA).not.toHaveBeenCalled();
    });

    it('should run an `unless` validator if the given method returns a falsy value', function() {
      var m = A.create();

      spyOn(m, 'validatorB');

      m.shouldntValidate(false);
      m.validate();
      expect(m.validatorB).toHaveBeenCalled();
    });

    it('should not run an `unless` validator if the given method returns a truthy value', function() {
      var m = A.create();

      spyOn(m, 'validatorB');

      m.shouldntValidate(true);
      m.validate();
      expect(m.validatorB).not.toHaveBeenCalled();
    });
  });
});

describe('Z.Model.clearIdentityMap', function() {
  it('should remove all objects from the identity map', function() {
    var m = Test.BasicModel.create({id: 1111});

    expect(Test.BasicModel.fetch(1111)).toBe(m);
    Z.Model.clearIdentityMap();
    expect(Test.BasicModel.fetch(1111)).not.toBe(m);
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

describe('Z.Model `hasOne` association', function() {
  describe('with no inverse and `master` option set to `false`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {master: false});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should create a property with the given name', function() {
      expect(Test.Foo.hasProperty('bar')).toBe(true);
    });

    it('should initialize the `hasOne` property to `null`', function() {
      expect(Test.Foo.create().bar()).toBe(null);
    });

    it('should not mark the model as `DIRTY` when setting the hasOne side', function() {
      var f = Test.Foo.load({id: 91}), b = Test.Bar.create({id: 121});

      expect(f.isDirty()).toBe(false);
      f.bar(b);
      expect(f.isDirty()).toBe(false);
    });

    it('should not mark the model as `DIRTY` when unsetting the hasOne side', function() {
      var f = Test.Foo.load({id: 91}), b = Test.Bar.create({id: 121});

      expect(f.isDirty()).toBe(false);
      f.bar(b);
      expect(f.isDirty()).toBe(false);
      f.bar(null);
      expect(f.isDirty()).toBe(false);
    });

    it('should throw an exception when setting an object of the wrong type', function() {
      var baz = Z.Model.extend().create(), f = Test.Foo.create();

      expect(function() {
        f.bar(baz);
      }).toThrow(Z.fmt('Test.Foo.bar: expected an object of type `Test.Bar` but received %@ instead', baz));
    });
  });

  describe('with no inverse and `master` option set to `true`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {master: true});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should mark the model as `DIRTY` when setting', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bar(Test.Bar.create());
      expect(f.isDirty()).toBe(true);
    });

    it('should mark the model as `DIRTY` when clearing', function() {
      var f = Test.Foo.load({id: 12}), b = Test.Bar.load({id: 19});

      f.bar(b);
      f.save().updateModelDidSucceed();

      expect(f.isDirty()).toBe(false);
      f.bar(null);
      expect(f.isDirty()).toBe(true);
    });

    it('should throw an exception when setting on an `EMPTY` model', function() {
      var f = Test.Foo.empty(4);

      expect(function() {
        f.bar(Test.Bar.create());
      }).toThrow("Test.Foo.bar: can't set a hasOne association when the master side is EMPTY: " + f.toString());
    });

    it('should throw an exception when setting on a `DESTROYED` model', function() {
      var f = Test.Foo.load({id: 9});

      f.destroy().destroyModelDidSucceed();

      expect(function() {
        f.bar(Test.Bar.create());
      }).toThrow("Test.Foo.bar: can't set a hasOne association when the master side is DESTROYED: " + f.toString());
    });

    it('should throw an exception when setting on a `BUSY` model', function() {
      var f = Test.Foo.load({id: 12});

      f.refresh();
      expect(f.isBusy()).toBe(true);
      expect(function() {
        f.bar(Test.Bar.create());
      }).toThrow("Test.Foo.bar: can't set a hasOne association when the master side is LOADED-BUSY: " + f.toString());
    });
  });

  describe('with `hasOne` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {inverse: 'foo'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasOne('foo', 'Test.Foo', {inverse: 'bar'});
      });
    });

    it('should set the receiver as the inverse when setting', function() {
      var f1 = Test.Foo.create(),
          f2 = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

      f1.bar(b1);
      expect(b1.foo()).toBe(f1);

      b2.foo(f2);
      expect(b2.foo()).toBe(f2);
    });

    it('should clear both sides of the association when setting one side to `null`', function() {
      var f = Test.Foo.create(), b = Test.Bar.create();

      f.bar(b);
      expect(f.bar()).toBe(b);
      expect(b.foo()).toBe(f);
      f.bar(null);
      expect(f.bar()).toBe(null);
      expect(b.foo()).toBe(null);
    });
  });

  describe('with `hasMany` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {inverse: 'foos'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasMany('foos', 'Test.Foo', {inverse: 'bar'});
      });
    });

    it('should add the receiver to the inverse array when setting', function() {
      var f1 = Test.Foo.create(), f2 = Test.Foo.create(), b = Test.Bar.create();

      f1.bar(b);
      expect(b.foos()).toEq(Z.A(f1));
      f2.bar(b);
      expect(b.foos()).toEq(Z.A(f1, f2));
    });

    it('should remove the receiver from teh inverse array when clearing', function() {
      var f1 = Test.Foo.create(), f2 = Test.Foo.create(), b = Test.Bar.create();

      f1.bar(b);
      f2.bar(b);

      expect(b.foos()).toEq(Z.A(f1, f2));

      f1.bar(null);
      expect(b.foos()).toEq(Z.A(f2));
      f2.bar(null);
      expect(b.foos()).toEq(Z.A());
    });
  });
});

describe('Z.Model `hasMany` association', function() {
  describe('with no inverse and `master` option set to `false`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {master: false});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should create a property with the given name', function() {
      expect(Test.Foo.hasProperty('bars')).toBe(true);
    });

    it('should initialize the `hasMany` property to an empty `Z.Array`', function() {
      expect(Test.Foo.create().bars()).toEq(Z.A());
    });

    it('should not mark the model as `DIRTY` when adding objects', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bars().push(Test.Bar.create());
      expect(f.isDirty()).toBe(false);
    });

    it('should not mark the model as `DIRTY` when removing objects', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bars().push(Test.Bar.create());
      expect(f.isDirty()).toBe(false);
      f.bars().pop();
      expect(f.isDirty()).toBe(false);
    });

    it('should throw an exception when adding objects of the wrong type', function() {
      var baz = Z.Model.extend().create(), f = Test.Foo.create();

      expect(function() {
        f.bars().push(baz);
      }).toThrow(Z.fmt('Test.Foo.bars: expected an object of type `Test.Bar` but received %@ instead', baz));
    });
  });

  describe('with no inverse and `master` option set to `true`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {master: true});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should mark the model as `DIRTY` when adding objects', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bars().push(Test.Bar.create());
      expect(f.isDirty()).toBe(true);
    });

    it('should mark the model as `DIRTY` when removing objects', function() {
      var f = Test.Foo.load({id: 12}), b = Test.Bar.load({id: 19});

      f.bars().push(b);
      f.save().updateModelDidSucceed();

      expect(f.isDirty()).toBe(false);
      f.bars().pop();
      expect(f.isDirty()).toBe(true);
    });

    it('should throw an exception when adding objects to an `EMPTY` model', function() {
      var f = Test.Foo.empty(4);

      expect(function() {
        f.bars().push(Test.Bar.create());
      }).toThrow("Test.Foo.bars: can't add to a hasMany association when the master side is EMPTY: " + f.toString());
    });

    it('should throw an exception when adding objects to a `DESTROYED` model', function() {
      var f = Test.Foo.load({id: 12});

      f.destroy().destroyModelDidSucceed();

      expect(function() {
        f.bars().push(Test.Bar.create());
      }).toThrow("Test.Foo.bars: can't add to a hasMany association when the master side is DESTROYED: " + f.toString());
    });

    it('should throw an exception when adding objects to a `BUSY` model', function() {
      var f = Test.Foo.load({id: 12});

      f.refresh();
      expect(f.isBusy()).toBe(true);
      expect(function() {
        f.bars().push(Test.Bar.create());
      }).toThrow("Test.Foo.bars: can't add to a hasMany association when the master side is LOADED-BUSY: " + f.toString());
    });
  });

  describe('with `hasOne` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {inverse: 'foo'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasOne('foo', 'Test.Foo', {inverse: 'bars'});
      });
    });

    it('should set the inverse on the hasOne side when adding to the hasMany side', function() {
      var f = Test.Foo.create(), b1 = Test.Bar.create(), b2 = Test.Bar.create();

      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
      f.bars().push(b1);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
    });

    it('should clear the inverse on the hasOne side when removing from the hasMany side', function() {
      var f = Test.Foo.create(), b1 = Test.Bar.create(), b2 = Test.Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars().pop();
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
    });

    it('should clear the inverse on the hasOne side when the hasMany side is cleared', function() {
      var f = Test.Foo.create(), b1 = Test.Bar.create(), b2 = Test.Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars().clear();
      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
    });
  });

  describe('with `hasMany` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {inverse: 'foos'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasMany('foos', 'Test.Foo', {inverse: 'bars'});
      });
    });

    it('should add to the other side when an object is added', function() {
      var f1 = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

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

    it('should remove from the other side when an object is added', function() {
      var f1 = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

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

}());
