(function() {

var Z = this.Z || require('zoom');

describe('Z.merge', function() {
  it('should merge values from sources objects into the given destination object', function() {
    var r;
    
    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 9, baz: 3 });

    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { bar: 10, quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 10, baz: 3, quux: 12 });
  });
});

describe('Z.defaults', function() {
  it('should merge values from default objects that are not present in the given object', function() {
    var r;

    r = Z.defaults({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 2, baz: 3 });
    r = Z.defaults({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 2, baz: 3, quux: 12 });
  });
});

}());
