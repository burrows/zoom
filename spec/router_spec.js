(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Route.matchHash', function() {
  it('should properly match hashes with no params', function() {
    expect(Z.Route.create('foo').matchHash('foo')).toEq({});
    expect(Z.Route.create('foo/bar').matchHash('foo/bar')).toEq({});
    expect(Z.Route.create('foo/bar/baz').matchHash('foo/bar/baz')).toEq({});
    expect(Z.Route.create('foo').matchHash('bar')).toBe(null);
    expect(Z.Route.create('foo/bar').matchHash('foo/ba')).toBe(null);
    expect(Z.Route.create('foo/bar').matchHash('oo/bar')).toBe(null);
  });

  it('should properly match hashes with a single named param', function() {
    var r = Z.Route.create('foos/:id');
    expect(r.matchHash('foos/1')).toEq({id: '1'});
    expect(r.matchHash('foos/121')).toEq({id: '121'});
    expect(r.matchHash('foos/bar')).toEq({id: 'bar'});
    expect(r.matchHash('bars/1')).toBe(null);
    expect(r.matchHash('foos/')).toBe(null);
  });

  it('should properly match hashes with a multiple named params', function() {
    var r = Z.Route.create('search/:query/p:page');
    expect(r.matchHash('search/something/p1')).toEq({query: 'something', page: '1'});
    expect(r.matchHash('search/blah/p123')).toEq({query: 'blah', page: '123'});
    expect(r.matchHash('search/blah/pfoo')).toEq({query: 'blah', page: 'foo'});
    expect(r.matchHash('search/blah/1')).toBe(null);
    expect(r.matchHash('search/1')).toBe(null);
    expect(r.matchHash('search/something')).toBe(null);
    expect(r.matchHash('earch/foo/p1')).toBe(null);
  });

  it('should properly match hashes with a single splat param', function() {
    var r = Z.Route.create('download/*path');
    expect(r.matchHash('download/')).toEq({path: ''});
    expect(r.matchHash('download/a')).toEq({path: 'a'});
    expect(r.matchHash('download/a/b/c/d')).toEq({path: 'a/b/c/d'});
    expect(r.matchHash('upload')).toBe(null);
    expect(r.matchHash('upload/a/b')).toBe(null);
    expect(r.matchHash('download')).toBe(null);
    expect(r.matchHash('x/download')).toBe(null);
  });

  it('should properly match hashes with multiple splat params', function() {
    var r = Z.Route.create('foo/*x/bar/*z');
    expect(r.matchHash('foo/a/bar/')).toEq({x: 'a', z: ''});
    expect(r.matchHash('foo/a/bar/b')).toEq({x: 'a', z: 'b'});
    expect(r.matchHash('foo/a/b/c/bar/d/e/f')).toEq({x: 'a/b/c', z: 'd/e/f'});
    expect(r.matchHash('foo/')).toBe(null);
    expect(r.matchHash('foo/bar')).toBe(null);
    expect(r.matchHash('foo/a/bar')).toBe(null);
  });

  it('should properly match hashes with both named and splat params', function() {
    var r = Z.Route.create('foo/*x/bar/:id');
    expect(r.matchHash('foo/a/bar/1')).toEq({x: 'a', id: '1'});
    expect(r.matchHash('foo/a/b/c/bar/1')).toEq({x: 'a/b/c', id: '1'});
    expect(r.matchHash('foo/a/b/c/bar/baz')).toEq({x: 'a/b/c', id: 'baz'});
    expect(r.matchHash('foo/bar/baz')).toEq(null);
    expect(r.matchHash('foo/x/bar/')).toEq(null);
  });
});

describe('Z.Route.matchParams', function() {
  it("should return true if the given param names match the route's param names and false otherwise", function() {
    var r1 = Z.Route.create('foo/bar'),
        r2 = Z.Route.create('foo/bar/:id/:x/:y'),
        r3 = Z.Route.create('foo/*a/bar/*b');

    expect(r1.matchParams([])).toBe(true);
    expect(r1.matchParams(['foo'])).toBe(false);

    expect(r2.matchParams(['id', 'x', 'y'])).toBe(true);
    expect(r2.matchParams(['x', 'id', 'y'])).toBe(true);
    expect(r2.matchParams(['x', 'y', 'id'])).toBe(true);
    expect(r2.matchParams(['x', 'id'])).toBe(false);
    expect(r2.matchParams(['id', 'x', 'y', 'z'])).toBe(false);
    expect(r2.matchParams([])).toBe(false);

    expect(r3.matchParams(['a', 'b'])).toBe(true);
    expect(r3.matchParams(['b', 'a'])).toBe(true);
    expect(r3.matchParams(['a'])).toBe(false);
    expect(r3.matchParams(['b'])).toBe(false);
    expect(r3.matchParams([])).toBe(false);
  });
});

describe('Z.Route.generate', function() {
  it('should return a string with the given param values interpolated into the pattern', function() {
    var r1 = Z.Route.create('foo/bar'),
        r2 = Z.Route.create('foo/bar/:id/:x/:y'),
        r3 = Z.Route.create('foo/*a/bar/*b');

    expect(r1.generate({})).toBe('foo/bar');

    expect(r2.generate({id: 1, x: 'blah', y: 'blarf'})).toBe('foo/bar/1/blah/blarf');
    expect(r2.generate({id: 'hey', x: 'blah', y: 'blarf'})).toBe('foo/bar/hey/blah/blarf');

    expect(r3.generate({a: 'a/aa/aaa', b: '1234'})).toBe('foo/a/aa/aaa/bar/1234')
    expect(r3.generate({a: 1, b: null})).toBe('foo/1/bar/')
    expect(r3.generate({a: null, b: null})).toBe('foo//bar/')
  });
});

}());
