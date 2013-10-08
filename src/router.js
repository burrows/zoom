// The `Z.Router` singleton object can be used to add location hash routing to
// an application. It observes changes to the browser's location hash
// (`window.location.hash` via the `window`'s `hashchange` event), matches the
// new hash value against the defined routes, and emits a `route:<name>` event
// for the matching route and passes along any parameters extracted from the
// hash as the data argument.
//
// When an application decides that it wants to update the current hash, it can
// set the `Z.Router.current` property to the name of a defined route and set
// any parameters (`Z.Router.params`) necessary to generate the new hash. To
// actually modify the browser's hash, the `Z.Router.render` method must be
// used. This is typically done during the run loop by `Z.RunLoop`. Calling the
// `render` method will not emit any `route:` events.
//
// Routes are defined with a matcher regular expression and a generator
// function. The regular expression may contain capturing parenthesis, the
// captured values will be passed along as the data argument with the emitted
// `route:` events. The generator function is used to construct a new hash when
// either the `current` or `params` properties change.
Z.Router = Z.Object.extend(Z.Observable, function() {
  var stripHash, routes;

  // Internal: A regular expression that can be used to clean up a hash value.
  stripHash = /^#|\/?$/;

  // Internal: A native object containing route definitions.
  routes = {};

  // Internal: The `hash` property observer - simply records that the location
  // hash needs to be updated.
  //
  // Returns nothing.
  function hashDidChange() { this.__needsUpdate__ = true; }

  // Internal: The `hashchange` event handler.
  //
  // Returns nothing.
  function processLocationHashChange() {
    if (this.__rendering__) { this.__rendering__ = false; return; }
    this.routeHash(Z.global.location.hash);
  }

  // Public: The name of the current route. Updating this property an then
  // calling the `render` method will cause the browser's location hash to
  // change.
  this.prop('current');

  // Public: A `Z.Hash` containing the parameters to use to generate the hash.
  this.prop('params', {def: Z.H()});

  // Public: A computed property that returns a string to use as the browser's
  // location hash. The `render` method must be called after this property
  // changes in order to actually update the browser's location hash.
  this.prop('hash', {
    dependsOn: ['current', 'params.@'],
    readonly: true,
    get: function() {
      var current = this.current(), params = this.params().toNative();
      if (!current || !routes[current]) { return null; }
      return this.generate(current, params);
    }
  });

  // Public: When set to `true`, the `render` method will cause the new
  // location to be pushed onto the browser's history. When set to `false`, a
  // the new location will not be added to the browser's history.
  this.prop('push', {def: true});

  // Public: Initializes the rotuer by causing it to start observing
  // `hashchange` events as well as changes to the `hash` property.
  this.def('init', function() {
    this.supr();
    this.on('didChange:hash', hashDidChange);
    this.__hashChangeListener__ = Z.bind(processLocationHashChange, this);
    if (Z.global.window) {
      Z.global.window.addEventListener('hashchange', this.__hashChangeListener__, false);
    }
  });

  // Public: Resets the router by clearing all defined routes.
  this.def('reset', function() {
    routes = {};
    this.current(null);
    this.params().clear();
    return this;
  });

  // Public: Defines a new route.
  //
  // name      - A string containing the name of the route.
  // matcher   - A `RegExp` object that can be used to match against hash
  //             values. Any captures made by the regex will be passed as the
  //             data argument with `route` events.
  // generator - A function that will generate a new hash for the route. A
  //             native object created from the `params` property will be passed
  //             to this function when the router needs to generate a new hash
  //             when the `current` or `params` properties change.
  //
  // Returns the receiver.
  // Throws `Error` if a route with the given name already exists.
  this.def('route', function(name, matcher, generator) {
    if (routes[name]) {
      throw new Error(Z.fmt("Z.Router.route: a route with the name '%@' already exists", name));
    }

    routes[name] = {name: name, matcher: matcher, generator: generator};

    return this;
  });

  // Internal: Takes a hash value and attempts to find a matching route. When a
  // match is found, the `route` event is emitted with a data argument
  // containing the route name and params. When a match can't be found then the
  // `unknownRoute` event is emitted with the hash value as the data argument.
  //
  // hash - A string containing the current value of the location hash.
  //
  // Returns `true` if a match was found and `false` otherwise.
  this.def('routeHash', function(hash) {
    var name, match, route, params;

    hash = hash.replace(stripHash, '');

    for (name in routes) {
      if (!routes.hasOwnProperty(name)) { continue; }

      if ((match = routes[name].matcher.exec(hash))) {
        route  = routes[name];
        params = match.slice(1);
        break;
      }
    }

    if (route) {
      this.emit('route:' + route.name, params);
      return true;
    }
    else {
      this.emit('unknownRoute', hash);
      return false;
    }
  });

  // Public: Causes the router to process the current value of
  // `window.location.hash`. Normally hash changes are routed automatically, but
  // this method is useful during app initialization.
  //
  // Returns `true` if a match was found and `false` otherwise.
  this.def('routeCurrentHash', function() {
    return this.routeHash(Z.global.location.hash);
  });

  // Public: Sets the browser's location hash to the value of the `hash`
  // property if it has changed since the last time `render` was called.
  //
  // If the `push` property is set to `true` then the new location will be added
  // to the browser's history. If `push` is `false` then the new location will
  // not be added to the browser's history.
  this.def('render', function() {
    var oldhash, newhash;
    if (!this.__needsUpdate__) { return; }

    oldhash = Z.global.location.hash;
    newhash = this.hash();

    if (oldhash.replace(stripHash, '') !== newhash.replace(stripHash, '')) {
      this.__rendering__ = true;
      if (this.push()) {
        Z.global.location.hash = newhash;
      }
      else {
        Z.global.location.replace(Z.global.location.toString().replace(/#.*$/, '') + newhash);
      }
    }

    this.__needsUpdate__ = false;
  });

  // Public: Generates a new hash value for the given route name and params.
  //
  // name   - A string containing the name of the route to generate the hash
  //          for.
  // params - A native object containing params that the route's generator
  //          function expects.
  //
  // Returns a string containing the generated hash.
  // Throws `Error` if a route with the given name does not exist.
  this.def('generate', function(name, params) {
    var route = routes[name], hash;

    if (!route) {
      throw new Error(Z.fmt("Z.Router.generate: unknown route name: '%@'", name));
    }

    hash = route.generator(params);

    if (hash[0] !== '#') { hash = '#' + hash; }

    return hash;
  });
}).create();

