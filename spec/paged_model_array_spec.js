(function() {

var Model;

if (!this.Z) { require('./helper'); }

beforeEach(function() { Z.Model.reset(); });

Model = Z.Model.extend(function() {
  this.attr('foo', 'string');
});

describe('Z.PagedModelArray', function() {
  var array;

  beforeEach(function() {
    array = Z.PagedModelArray.create(Model, 3);
  });

  describe('.init', function() {
    it('should set the modelType and pageSize properties', function() {
      expect(array.modelType).toBe(Model);
      expect(array.pageSize).toBe(3);
    });
  });

  describe('.load', function() {
    beforeEach(function() {
      spyOn(array, 'loadPage');
    });

    it('should save the options to the opts property', function() {
      array.load({foo: 'blah', bar: 8});
      expect(array.opts).toEq({foo: 'blah', bar: 8});
    });

    it('should merge the given options with the default options given to the `init` method', function() {
      var a = Z.PagedModelArray.create(Model, 3, {a: 1, b: 2});
      a.load({b: 20, c: 30});
      expect(a.opts).toEq({a: 1, b: 20, c: 30});
    });

    it('should clear the existing contents of the array', function() {
      spyOn(array, 'clear');
      array.load();
      expect(array.clear).toHaveBeenCalled();
    });

    it('should invoke the `loadPage` method with page 0', function() {
      array.load();
      expect(array.loadPage).toHaveBeenCalledWith(0);
    });

    it('should invoke the `loadPage` method with the given page option', function() {
      array.load({page: 12});
      expect(array.loadPage).toHaveBeenCalledWith(12);
    });
  });

  describe('.loadPage', function() {
    beforeEach(function() { spyOn(Model.mapper, 'findPagedModels'); });

    it('should set `isBusy` to `true`', function() {
      expect(array.isBusy()).toBe(false);
      array.loadPage(0);
      expect(array.isBusy()).toBe(true);
    });

    it("should invoke the `findPagedModels` method on the type's mapper with the receiver, given page, and options as arguments", function() {
      array.opts = {};
      array.loadPage(0);
      expect(Model.mapper.findPagedModels).toHaveBeenCalledWith(array, 0, {});
    });

    it("should not invoke the `findPagedModels` method on the type's mapper when the array is already busy fetching the given page", function() {
      array.loadPage(0);
      expect(Model.mapper.findPagedModels.callCount).toBe(1);
      array.loadPage(0);
      expect(Model.mapper.findPagedModels.callCount).toBe(1);
    });
  });

  describe('.findPagedModelsDidSucceed', function() {
    it('should set the size of the array to the given total count', function() {
      var models = [Model.load({id: 1}), Model.load({id: 2}), Model.load({id: 3})];
      expect(array.size()).toBe(0);
      array.loadPage(0);
      array.findPagedModelsDidSucceed(models, 0, 10);
      expect(array.size()).toBe(10);
    });

    it('should add the given models to the array starting at the index indicated by the given page', function() {
      var models = [Model.load({id: 1}), Model.load({id: 2}), Model.load({id: 3})];
      array.loadPage(3);
      array.findPagedModelsDidSucceed(models, 3, 30);
      expect(array.slice(9, 3)).toEq(Z.Array.create(models));
    });

    it('should set isBusy to false if there are no busy pages', function() {
      array.loadPage(0);
      expect(array.isBusy()).toBe(true);
      array.findPagedModelsDidSucceed([], 0, 0);
      expect(array.isBusy()).toBe(false);
    });

    it('should not set isBusy to false if there are still busy pages', function() {
      var models1 = [Model.load({id: 1}), Model.load({id: 2}), Model.load({id: 3})],
          models2 = [Model.load({id: 4}), Model.load({id: 5}), Model.load({id: 6})];
      array.loadPage(0);
      array.loadPage(1);
      expect(array.isBusy()).toBe(true);
      array.findPagedModelsDidSucceed(models1, 0, 6);
      expect(array.isBusy()).toBe(true);
      array.findPagedModelsDidSucceed(models2, 1, 6);
      expect(array.isBusy()).toBe(false);
    });
  });

  describe('.findPagedModelsDidFail', function() {
    it('should set the `error` property', function() {
      array.loadPage(0);
      array.findPagedModelsDidFail('some error', 0);
      expect(array.error()).toBe('some error');
    });

    it('should set isBusy to false if there are no busy pages', function() {
      array.loadPage(0);
      expect(array.isBusy()).toBe(true);
      array.findPagedModelsDidFail('blah', 0);
      expect(array.isBusy()).toBe(false);
    });

    it('should not set isBusy to false if there are still busy pages', function() {
      array.loadPage(0);
      array.loadPage(1);
      expect(array.isBusy()).toBe(true);
      array.findPagedModelsDidFail('error1', 0);
      expect(array.isBusy()).toBe(true);
      array.findPagedModelsDidFail('error1', 1);
      expect(array.isBusy()).toBe(false);
    });
  });
});

}());

