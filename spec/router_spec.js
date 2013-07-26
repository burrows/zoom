(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Router', function() {
  var stubloc = false, router, currentRoute, currentUnknown;

  function routeHandler(name, params) {
    currentRoute = {name: name, params: params};
  }

  function unknownRouteHandler(route) {
    currentUnknown = route;
  }

  beforeEach(function() {
    currentRoute   = null;
    currentUnknown = null;

    if (!Z.global.location) {
      Z.global.location = {hash: ''};
      stubloc = true;
    }

    router = Z.Router.create(routeHandler, unknownRouteHandler);

    router.route('home', /^$/, function() { return ''; });

    router.route('search', /^search\/(.*?)(?:\/p(\d+))?$/, function(params) {
      var hash = 'search/' + params.query;
      if (params.page) { hash = hash + '/p' + params.page; }
      return hash;
    });

    router.route('showWidget', /^widgets\/(\d+)$/, function(params) {
      return '#widgets/' + params.id;
    });

    router.start();
  });

  afterEach(function() {
    router.stop().reset();
    if (stubloc) { Z.del(Z.global, 'location'); }
  });

  describe('.route', function() {
    it('should throw an exception if a route with the given name is alread defined', function() {
      expect(function() {
        router.route('home', /foo/, function() {});
      }).toThrow("Z.Router.route: a route with the name 'home' already exists");
    });
  });

  describe('.hash', function() {
    it('should return `null` if `current` is `null`', function() {
      router.current(null);
      expect(router.hash()).toBe(null);
    });

    it('should return `null` if `current` is set to an unknown route name', function() {
      router.current('foobar');
      expect(router.hash()).toBe(null);
    });

    it('should use the route with the same name as the `current` property and generate a hash using the current value of `params`', function() {
      router.current('home');
      expect(router.hash()).toBe('#');

      router.current('search');
      router.set('params.query', 'findme');
      expect(router.hash()).toBe('#search/findme');

      router.set('params.page', 12);
      expect(router.hash()).toBe('#search/findme/p12');

      router.current('showWidget');
      router.set('params.id', 121);
      expect(router.hash()).toBe('#widgets/121');
    });
  });

  describe('.routeHash', function() {
    it('should find the first matching route, extract params, and invoke callback with route name and params', function() {
      router.routeHash('');
      expect(currentRoute.name).toBe('home');
      expect(currentRoute.params).toEq([]);

      router.routeHash('search/something/p3');
      expect(currentRoute.name).toBe('search');
      expect(currentRoute.params).toEq(['something', '3']);
    });

    it('should invoke the errback if no matching route is found', function() {
      expect(currentUnknown).toBe(null);
      router.routeHash('foo/bar/baz');
      expect(currentUnknown).toBe('foo/bar/baz');
    });
  });

  describe('.updateHash', function() {
    it('should set the location hash to the current value of the `hash` property', function() {
      router.current('showWidget');
      router.set('params.id', 452);

      expect(Z.global.location.hash).toBe('');
      router.updateHash();
      expect(Z.global.location.hash).toBe('#widgets/452');
    });
  });

  describe('.generate', function() {
    it('should throw an exception if given an unknown route name', function() {
      expect(function() {
        router.generate('foobar');
      }).toThrow("Z.Router.generate: unknown route name: 'foobar'");
    });

    it('should lookup the route and invoke its generator with the given params', function() {
      expect(router.generate('home')).toBe('#');
      expect(router.generate('search', {query: 'foo', page: 9})).toBe('#search/foo/p9');
      expect(router.generate('showWidget', {id: 973})).toBe('#widgets/973');
    });
  });
});

}());
