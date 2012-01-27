(function(undefined) {

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

describe('Z.type', function() {
  it("should return the string 'null' when passed `null`", function() {
    expect(Z.type(null)).toBe('null');
  });

  it("should return the string 'undefined' when passed `undefined`", function() {
    expect(Z.type(undefined)).toBe('undefined');
    expect(Z.type(void 0)).toBe('undefined');
  });

  it("should return the string 'array' when passed an Array instance", function() {
    expect(Z.type([])).toBe('array');
    expect(Z.type([1,2,3])).toBe('array');
  });

  it("should return the string 'function' when passed a Function instance", function() {
    expect(Z.type(function() {})).toBe('function');
    expect(Z.type(Object)).toBe('function');
  });

  it("should return the string 'string' when passed a string", function() {
    expect(Z.type('')).toBe('string');
    expect(Z.type('foobar')).toBe('string');
  });

  it("should return the string 'number' when passed a number", function() {
    expect(Z.type(0)).toBe('number');
    expect(Z.type(1.234)).toBe('number');
    expect(Z.type(NaN)).toBe('number');
    expect(Z.type(1/0)).toBe('number');
  });

  it("should return the string 'boolean' when passed `true` or `false`", function() {
    expect(Z.type(true)).toBe('boolean');
    expect(Z.type(false)).toBe('boolean');
  });

  it("should return the string 'date' when passed a Date instance", function() {
    expect(Z.type(new Date())).toBe('date');
  });

  it("should return the string 'regexp' when passed a RegExp instance", function() {
    expect(Z.type(/foo/)).toBe('regexp');
    expect(Z.type(new RegExp())).toBe('regexp');
  });

  it("should return the string 'object' when passed an Object instance", function() {
    expect(Z.type({})).toBe('object');
    expect(Z.type({foo: 1})).toBe('object');
    expect(Z.type(Object.create(null))).toBe('object');
    expect(Z.type(Object.create({}))).toBe('object');
  });

  it("should return the string 'zobject' when passed an object with Z.Object in its prototype chain", function() {
    expect(Z.type(Z.Object)).toBe('zobject');
    expect(Z.type(Z.Object.create())).toBe('zobject');
    expect(Z.type(Z.Array.create())).toBe('zobject');
    expect(Z.type(Z.Hash.create())).toBe('zobject');
  });
});

describe('Z.isNaN', function() {
  it('should return `true` when passed `NaN` and false otherwise', function() {
    expect(Z.isNaN(NaN)).toBe(true);
    expect(Z.isNaN(1)).toBe(false);
    expect(Z.isNaN(1/0)).toBe(false);
    expect(Z.isNaN('')).toBe(false);
    expect(Z.isNaN([])).toBe(false);
    expect(Z.isNaN({})).toBe(false);
  });
});

}());
