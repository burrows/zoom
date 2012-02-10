(function() {

var Z = this.Z || require('zoom'), TestModel, mapper;

TestModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
});

mapper = TestModel.mapper;

describe('Z.Model default mapper', function() {
  describe('fetchModel', function() {
    //it("should should invoke the `fetchModelDidFail` method on the model type after a brief timeout", function() {
    //  spyOn(TestModel, 'fetchModelDidFail');

    //  runs(function() {
    //    mapper.fetchModel(TestModel, 2);
    //  });

    //  waits(1);

    //  runs(function() {
    //    expect(TestModel.fetchModelDidFail).toHaveBeenCalledWith(2);
    //  });
    //});
  });
});

}());

