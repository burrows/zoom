(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Route.matchHash', function() {
  it('should properly match hashes with no params', function() {
    expect(Z.Route.create('x', 'foo').matchHash('foo')).toEq({});
    expect(Z.Route.create('x', 'foo/bar').matchHash('foo/bar')).toEq({});
    expect(Z.Route.create('x', 'foo/bar/baz').matchHash('foo/bar/baz')).toEq({});
    expect(Z.Route.create('x', 'foo').matchHash('bar')).toBe(null);
    expect(Z.Route.create('x', 'foo/bar').matchHash('foo/ba')).toBe(null);
    expect(Z.Route.create('x', 'foo/bar').matchHash('oo/bar')).toBe(null);
  });

  it('should properly match hashes with a single named param', function() {
    var r = Z.Route.create('foos', 'foos/:id');
    expect(r.matchHash('foos/1')).toEq({id: '1'});
    expect(r.matchHash('foos/121')).toEq({id: '121'});
    expect(r.matchHash('foos/bar')).toEq({id: 'bar'});
    expect(r.matchHash('bars/1')).toBe(null);
    expect(r.matchHash('foos/')).toBe(null);
  });

  it('should properly match hashes with a multiple named params', function() {
    var r = Z.Route.create('search', 'search/:query/p:page');
    expect(r.matchHash('search/something/p1')).toEq({query: 'something', page: '1'});
    expect(r.matchHash('search/blah/p123')).toEq({query: 'blah', page: '123'});
    expect(r.matchHash('search/blah/pfoo')).toEq({query: 'blah', page: 'foo'});
    expect(r.matchHash('search/blah/1')).toBe(null);
    expect(r.matchHash('search/1')).toBe(null);
    expect(r.matchHash('search/something')).toBe(null);
    expect(r.matchHash('earch/foo/p1')).toBe(null);
  });

  it('should properly match hashes with a single splat param', function() {
    var r = Z.Route.create('download', 'download/*path');
    expect(r.matchHash('download/')).toEq({path: ''});
    expect(r.matchHash('download/a')).toEq({path: 'a'});
    expect(r.matchHash('download/a/b/c/d')).toEq({path: 'a/b/c/d'});
    expect(r.matchHash('upload')).toBe(null);
    expect(r.matchHash('upload/a/b')).toBe(null);
    expect(r.matchHash('download')).toBe(null);
    expect(r.matchHash('x/download')).toBe(null);
  });

  it('should properly match hashes with multiple splat params', function() {
    var r = Z.Route.create('x', 'foo/*x/bar/*z');
    expect(r.matchHash('foo/a/bar/')).toEq({x: 'a', z: ''});
    expect(r.matchHash('foo/a/bar/b')).toEq({x: 'a', z: 'b'});
    expect(r.matchHash('foo/a/b/c/bar/d/e/f')).toEq({x: 'a/b/c', z: 'd/e/f'});
    expect(r.matchHash('foo/')).toBe(null);
    expect(r.matchHash('foo/bar')).toBe(null);
    expect(r.matchHash('foo/a/bar')).toBe(null);
  });

  it('should properly match hashes with both named and splat params', function() {
    var r = Z.Route.create('x', 'foo/*x/bar/:id');
    expect(r.matchHash('foo/a/bar/1')).toEq({x: 'a', id: '1'});
    expect(r.matchHash('foo/a/b/c/bar/1')).toEq({x: 'a/b/c', id: '1'});
    expect(r.matchHash('foo/a/b/c/bar/baz')).toEq({x: 'a/b/c', id: 'baz'});
    expect(r.matchHash('foo/bar/baz')).toEq(null);
    expect(r.matchHash('foo/x/bar/')).toEq(null);
  });
});

describe('Z.Route.matchParams', function() {
  it("should return true if the given param names match the route's param names and false otherwise", function() {
    var r1 = Z.Route.create('x', 'foo/bar'),
        r2 = Z.Route.create('y', 'foo/bar/:id/:x/:y'),
        r3 = Z.Route.create('z', 'foo/*a/bar/*b');

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
    var r1 = Z.Route.create('x', 'foo/bar'),
        r2 = Z.Route.create('y', 'foo/bar/:id/:x/:y'),
        r3 = Z.Route.create('z', 'foo/*a/bar/*b');

    expect(r1.generate({})).toBe('foo/bar');

    expect(r2.generate({id: 1, x: 'blah', y: 'blarf'})).toBe('foo/bar/1/blah/blarf');
    expect(r2.generate({id: 'hey', x: 'blah', y: 'blarf'})).toBe('foo/bar/hey/blah/blarf');

    expect(r3.generate({a: 'a/aa/aaa', b: '1234'})).toBe('foo/a/aa/aaa/bar/1234')
    expect(r3.generate({a: 1, b: null})).toBe('foo/1/bar/')
    expect(r3.generate({a: null, b: null})).toBe('foo//bar/')
  });
});

describe('Z.Router', function() {
  var router, loc;

  beforeEach(function() {
    loc = {hash: ''};
    router = Z.Router.create(function() {}, {location: loc});

    router.route('home',         'home');
    router.route('searchWidget', 'widgets/search/*query');
    router.route('searchWidget', 'widgets/search/*query/p:page');
    router.route('editWidget',   'widgets/:id/edit');
    router.route('showWidget',   'widgets/:id');
    router.route('showWidget',   'widgets/:id/:content');
    router.route('showWidget',   'widgets/:id/:content/p:page');
  });

  describe('.hash', function() {
    it('should generate an url hash based on the value of `current` and `params`', function() {
      router.current('home');
      expect(router.hash()).toBe('home');

      router.current('showWidget');
      router.params(Z.H('id', 12));
      expect(router.hash()).toBe('widgets/12');

      router.set('params.content', 'comments');
      expect(router.hash()).toBe('widgets/12/comments');

      router.set('params.page', 3);
      expect(router.hash()).toBe('widgets/12/comments/p3');

      router.current('editWidget');
      router.params(Z.H('id', 555));
      expect(router.hash()).toBe('widgets/555/edit');

      router.current('searchWidget');
      router.params(Z.H('query', 'foo/bar/baz'));
      expect(router.hash()).toBe('widgets/search/foo/bar/baz');

      router.params(Z.H('query', 'something'));
      expect(router.hash()).toBe('widgets/search/something');
    });
  });

  describe('.recognize', function() {
    it('should return `null` if the given hash does not match any routes', function() {
      expect(router.recognize('foo/bar')).toBe(null);
      expect(router.recognize('homex')).toBe(null);
    });

    it('should return an object containing the first matching route object and parsed params', function() {
      expect(router.recognize('home').route.name).toBe('home');
      expect(router.recognize('home').params).toEq({});

      expect(router.recognize('widgets/12').route.name).toBe('showWidget');
      expect(router.recognize('widgets/12').params).toEq({id: '12'});

      expect(router.recognize('widgets/12/comments').route.name).toBe('showWidget');
      expect(router.recognize('widgets/12/comments').params).toEq({id: '12', content: 'comments'});
      expect(router.recognize('widgets/12/reviews').route.name).toBe('showWidget');
      expect(router.recognize('widgets/12/reviews').params).toEq({id: '12', content: 'reviews'});

      expect(router.recognize('widgets/12/comments/p121').route.name).toBe('showWidget');
      expect(router.recognize('widgets/12/comments/p121').params).toEq({id: '12', content: 'comments', page: '121'});

      expect(router.recognize('widgets/12/edit').route.name).toBe('editWidget');
      expect(router.recognize('widgets/12/edit').params).toEq({id: '12'});

      expect(router.recognize('widgets/search/foo/bar/baz').route.name).toBe('searchWidget');
      expect(router.recognize('widgets/search/foo/bar/baz').params).toEq({query: 'foo/bar/baz'});

      expect(router.recognize('widgets/search/blah*foo').route.name).toBe('searchWidget');
      expect(router.recognize('widgets/search/blah*foo').params).toEq({query: 'blah*foo'});
    });
  });

  describe('.updateHash', function() {
    it('should set the location hash to the current value of the `hash` property', function() {
      router.current('showWidget');
      router.params(Z.H('id', 12));

      expect(loc.hash).toBe('');
      router.updateHash();
      expect(loc.hash).toBe('widgets/12');
    });
  });
});

}());
