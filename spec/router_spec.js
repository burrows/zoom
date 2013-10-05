(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Router', function() {
  var stubloc = false, router, routeHandler, unknownRouteHandler;

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

    Z.Router.route('home', /^$/, function() { return ''; });

    Z.Router.route('search', /^search\/(.*?)(?:\/p(\d+))?$/, function(params) {
      var hash = 'search/' + params.query;
      if (params.page) { hash = hash + '/p' + params.page; }
      return hash;
    });

    Z.Router.route('showWidget', /^widgets\/(\d+)$/, function(params) {
      return '#widgets/' + params.id;
    });

    routeHandler = jasmine.createSpy();
    unknownRouteHandler = jasmine.createSpy();

    Z.Router.on('route:*', routeHandler);
    Z.Router.on('unknownRoute', unknownRouteHandler);
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
    it('should find the first matching route, extract params, and emit a `route` event with route name as the namespace and route params as the data argument', function() {
      Z.Router.routeHash('');
      expect(routeHandler).toHaveBeenCalledWith('route:home', []);

      Z.Router.routeHash('search/something/p3');
      expect(routeHandler).toHaveBeenCalledWith('route:search', ['something', '3']);

      expect(unknownRouteHandler).not.toHaveBeenCalled();
    });

    it("should emit an `unknownRoute` event with the hash as the data argument when a matching route can't be found", function() {
      Z.Router.routeHash('foobar');
      expect(unknownRouteHandler).toHaveBeenCalledWith('unknownRoute', 'foobar');
      expect(routeHandler).not.toHaveBeenCalled();
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
