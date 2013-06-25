(function() {

var Model;

if (!this.Z) { require('./helper'); }

beforeEach(function() { Z.Model.reset(); });

Model = Z.Model.extend(function() {
  this.attr('foo', 'string');
});

describe('Z.ModelArray', function() {
  var array;

  beforeEach(function() {
    array = Z.ModelArray.create(Model);
    spyOn(Model.mapper, 'findModels');
  });

  describe('.find', function() {
    it('should set `isBusy` to `true`', function() {
      expect(array.isBusy()).toBe(false);
      array.find();
      expect(array.isBusy()).toBe(true);
    });

    it("should invoke the `findModels` method on the type's mapper with the array as the first argument", function() {
      array.find();
      expect(Model.mapper.findModels).toHaveBeenCalledWith(array, {});
    });

    it("should not invoke the `findModels` method on the type's mapper when the array is already busy", function() {
      array.find();
      array.find();
      expect(Model.mapper.findModels.callCount).toBe(1);
    });

    it('should queue the latest call to `.find` when the array is busy and invoke `.find` when the previous load finished', function() {
      array.find({foo: 1});
      expect(array.isBusy()).toBe(true);
      array.find({foo: 2});
      expect(Model.mapper.findModels.callCount).toBe(1);
      expect(Model.mapper.findModels).toHaveBeenCalledWith(array, {foo: 1});
      array.findModelsDidSucceed([]);
      expect(Model.mapper.findModels.callCount).toBe(2);
      expect(Model.mapper.findModels).toHaveBeenCalledWith(array, {foo: 2});
    });

    it('should forward the `load` options on to the `findModels` method on the mapper', function() {
      array.find({foo: 1});
      expect(Model.mapper.findModels).toHaveBeenCalledWith(array, {foo: 1});
    });

    it('should return itself', function() {
      expect(array.find()).toBe(array);
    });
  });

  describe('.findModelsDidSucceed', function() {
    it('should set `isBusy` to `false`', function() {
      array.find();
      expect(array.isBusy()).toBe(true);
      array.findModelsDidSucceed([]);
      expect(array.isBusy()).toBe(false);
    });

    it('should clear the current `error`', function() {
      array.error('some error');
      array.findModelsDidSucceed([]);
      expect(array.error()).toBeNull();
    });
  });

  describe('.findModelsDidFail', function() {
    it('should set `isBusy` to `false`', function() {
      array.find();
      expect(array.isBusy()).toBe(true);
      array.findModelsDidFail();
      expect(array.isBusy()).toBe(false);
    });

    it('should set the `error` property to the given error message', function() {
      expect(array.error()).toBeNull();
      array.find();
      array.findModelsDidFail('the error message');
      expect(array.error()).toBe('the error message');
    });
  });
});

}());
