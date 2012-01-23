(function() {

var Z = this.Z || require('zoom'), TestModel, mapper;

TestModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
});

mapper = TestModel.mapper;

describe('Z.Model default mapper', function() {
  describe('fetch', function() {
    it("should should invoke the `fetchDidFail` method on the model type after a brief timeout", function() {
      spyOn(TestModel, 'fetchDidFail');

      runs(function() {
        mapper.fetch(TestModel, 2);
      });

      waits(1);

      runs(function() {
        expect(TestModel.fetchDidFail).toHaveBeenCalledWith(2);
      });
    });
  });
});

}());

