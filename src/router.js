// The `Z.Router` object can be used to add location hash routing to an
// application. It observes changes to the browser's location hash
// (`window.location.hash` via the `window`'s `hashchange` event), matches the
// new hash value against the defined routes, and triggers a callback with the
// matching route name and any parameters extracted from the hash value.
//
// When an application decides that it wants to update the current hash, it can
// set the `Z.Router.current` property to the name of a defined route and set
// any parameters (`Z.Router.params`) necessary to generate the new hash. To
// actually modify the browser's hash, the `Z.Router.updateHash` method must be
// used. This is typically done during a run of the run loop. Calling the
// `updateHash` method will not trigger the router's callback.
//
// Routes are defined with a matcher regular expression and a generator
// function. The regular expression may contain capturing parenthesis, the
// captured values will be passed to the router's callback function along with
// the route name when a matching route is found. The generator function is used
// to construct a new hash when either the `current` or `params` properties
// change.
Z.Router = Z.Object.extend(Z.Observable, function() {
  var stripHash;

  // Internal: A regular expression that can be used to clean up a hash value.
  stripHash = /^#|\/?$/;

  // Internal: The `hash` property observer - simply records that the location
  // hash needs to be updated.
  //
  // Returns nothing.
  function hashDidChange() { this.__needsUpdate__ = true; }

  // Internal: The `hashchange` event handler.
  //
  // Returns nothing.
  function processLocationHashChange() {
    if (this.__updatingHash__) { this.__updatingHash__ = false; return; }
    this.routeHash(Z.global.location.hash);
  }

  // Public: The name of the current route. Updating this property an then
  // calling the `updateHash` method will cause the browser's location hash to
  // change.
  this.prop('current');

  // Public: A `Z.Hash` containing the parameters to use to generate the hash.
  this.prop('params', {def: Z.H()});

  // Public: A computed property that returns a string to use as the browser's
  // location hash. The `updateHash` method must be called after this property
  // changes in order to actually update the browser's location hash.
  this.prop('hash', {
    dependsOn: ['current', 'params.@'],
    readonly: true,
    get: function() {
      var current = this.current(), params = this.params().toNative();
      if (!current || !this.routes[current]) { return null; }
      return this.generate(current, params);
    }
  });

  // Public: When set to `true`, the `updateHash` method will cause the new
  // location to be pushed onto the browser's history. When set to `false`, a
  // the new location will not be added to the browser's history.
  this.prop('push', {def: true});

  this.def('init', function(callback, errback) {
    this.callback = callback;
    this.errback  = errback;
    this.routes   = {};
    return this.supr();
  });

  // Public: Defines a new route.
  //
  // name      - A string containing the name of the route.
  // matcher   - A `RegExp` object that can be used to match against hash
  //             values. Any captures made by the regex will be passed to the
  //             router's callback function when a matching route is found.
  // generator - A function that will generate a new hash for the route. A
  //             native object created from the `params` property will be passed
  //             to this function when the router needs to generate a new hash
  //             when the `current` or `params` properties change.
  //
  // Returns the receiver.
  // Throws `Error` if a route with the given name already exists.
  this.def('route', function(name, matcher, generator) {
    if (this.routes[name]) {
      throw new Error(Z.fmt("Z.Router.route: a route with the name '%@' already exists", name));
    }

    this.routes[name] = {matcher: matcher, generator: generator};

    return this;
  });

  // Public: Starts the rotuer by causing it to start observing `hashchange`
  // events as well as changes to the `hash` property.
  //
  // Returns the receiver.
  this.def('start', function() {
    this.observe('hash', this, hashDidChange);
    this.__hashChangeListener__ = Z.bind(processLocationHashChange, this);
    window.addEventListener('hashchange', this.__hashChangeListener__, false);
    this.__hashChangeListener__();
    Z.RunLoop.registerRouter(this).start();
    return this;
  });

  // Public: Stops the router by causing it to stop observing `hashchange`
  // events and changes to the `hash` property.
  //
  // Returns the receiver.
  this.def('stop', function() {
    this.stopObserving('hash', this, hashDidChange);
    window.removeEventListener('hashchange', this.__hashChangeListener__, false);
    Z.RunLoop.deregisterRouter(this);
    return this;
  });

  // Internal: Takes a hash value and attempts to find a matching route. When a
  // match is found, the callback is invoked with the route name and params.
  // When a match can't be found then the errback is invoked with the hash
  // value.
  //
  // hash - A string containing the current value of the location hash.
  //
  // Returns `true` if a match was found and `false` otherwise.
  this.def('routeHash', function(hash) {
    var r, match, route, params;

    hash = hash.replace(stripHash, '');

    for (r in this.routes) {
      if (!this.routes.hasOwnProperty(r)) { continue; }

      if ((match = this.routes[r].matcher.exec(hash))) {
        route  = r;
        params = match.slice(1);
        break;
      }
    }

    if (route) {
      this.callback(route, params);
      return true;
    }
    else {
      this.errback(hash);
      return false;
    }
  });

  // Public: Sets the browser's location hash to the value of the `hash`
  // property if it has changed since the last time `updateHash` was called.
  //
  // If the `push` property is set to `true` then the new location will be added
  // to the browser's history. If `push` is `false` then the new location will
  // not be added to the browser's history.
  this.def('updateHash', function() {
    var oldhash, newhash;
    if (!this.__needsUpdate__) { return; }

    oldhash = Z.global.location.hash;
    newhash = this.hash();

    if (oldhash.replace(stripHash, '') !== newhash.replace(stripHash, '')) {
      this.__updatingHash__ = true;
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
    var route = this.routes[name], hash;

    if (!route) {
      throw new Error(Z.fmt("Z.Router.generate: unknown route name: '%@'", name));
    }

    hash = route.generator(params);

    if (hash[0] !== '#') { hash = '#' + hash; }

    return hash;
  });
});

