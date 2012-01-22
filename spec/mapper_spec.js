(function() {

var Z = this.Z || require('zoom'), TestModel, mapper;

TestModel = Z.Model.extend(function() {
  this.attribute('foo', 'string');
  this.attribute('bar', 'integer');
});

mapper = TestModel.mapper;

describe('Z.Model default mapper', function() {
  describe('fetch', function() {
    it("should set the given model's state to NOT_FOUND after a brief timeout", function() {
      var m = TestModel.create({id: 2}, Z.Model.BUSY);

      runs(function() {
        expect(m.state()).toBe(Z.Model.BUSY);
        mapper.fetch(m, 2);
      });

      waits(1);

      runs(function() {
        expect(m.state()).toBe(Z.Model.NOT_FOUND);
      });
    });
  });
});

}());

