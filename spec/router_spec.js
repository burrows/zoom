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
    else {
      Z.global.location.hash = '';
    }

    Z.Router.route('home', /^$/, function() { return ''; }, routeHandler);

    Z.Router.route('search', /^search\/(.*?)(?:\/p(\d+))?$/, function(params) {
      var hash = 'search/' + params.query;
      if (params.page) { hash = hash + '/p' + params.page; }
      return hash;
    }, routeHandler);

    Z.Router.route('showWidget', /^widgets\/(\d+)$/, function(params) {
      return '#widgets/' + params.id;
    }, routeHandler);

    Z.Router.error(unknownRouteHandler);
  });

  afterEach(function() {
    Z.Router.reset();
    if (stubloc) { Z.del(Z.global, 'location'); }
  });

  describe('.route', function() {
    it('should throw an exception if a route with the given name is alread defined', function() {
      expect(function() {
        Z.Router.route('home', /foo/, function() {});
      }).toThrow("Z.Router.route: a route with the name 'home' already exists");
    });
  });

  describe('.hash', function() {
    it('should return `null` if `current` is `null`', function() {
      Z.Router.current(null);
      expect(Z.Router.hash()).toBe(null);
    });

    it('should return `null` if `current` is set to an unknown route name', function() {
      Z.Router.current('foobar');
      expect(Z.Router.hash()).toBe(null);
    });

    it('should use the route with the same name as the `current` property and generate a hash using the current value of `params`', function() {
      Z.Router.current('home');
      expect(Z.Router.hash()).toBe('#');

      Z.Router.current('search');
      Z.Router.set('params.query', 'findme');
      expect(Z.Router.hash()).toBe('#search/findme');

      Z.Router.set('params.page', 12);
      expect(Z.Router.hash()).toBe('#search/findme/p12');

      Z.Router.current('showWidget');
      Z.Router.set('params.id', 121);
      expect(Z.Router.hash()).toBe('#widgets/121');
    });
  });

  describe('.routeHash', function() {
    it('should find the first matching route, extract params, and invoke callback with route name and params', function() {
      Z.Router.routeHash('');
      expect(currentRoute.name).toBe('home');
      expect(currentRoute.params).toEq([]);

      Z.Router.routeHash('search/something/p3');
      expect(currentRoute.name).toBe('search');
      expect(currentRoute.params).toEq(['something', '3']);
    });

    it('should invoke all registered error handlers when a matching route is not found', function() {
      expect(currentUnknown).toBe(null);
      Z.Router.routeHash('foo/bar/baz');
      expect(currentUnknown).toBe('foo/bar/baz');
    });
  });

  describe('.render', function() {
    it('should set the location hash to the current value of the `hash` property', function() {
      Z.Router.current('showWidget');
      Z.Router.set('params.id', 452);

      expect(Z.global.location.hash).toBe('');
      Z.Router.render();
      expect(Z.global.location.hash).toBe('#widgets/452');
    });
  });

  describe('.generate', function() {
    it('should throw an exception if given an unknown route name', function() {
      expect(function() {
        Z.Router.generate('foo', {});
      }).toThrow("Z.Router.generate: unknown route name: 'foo'");
    });

    it('should lookup the route and invoke its generator with the given params', function() {
      expect(Z.Router.generate('home')).toBe('#');
      expect(Z.Router.generate('search', {query: 'foo', page: 9})).toBe('#search/foo/p9');
      expect(Z.Router.generate('showWidget', {id: 973})).toBe('#widgets/973');
    });
  });
});

}());
