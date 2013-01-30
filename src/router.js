// The `Z.Router` type provides an object that can be used to add location hash
// routing to an application. Instances observe changes to the browser's
// location hash (`window.location.hash` via the `window`'s `hashchange` event),
// match the new hash value against the defined routes, and trigger a callback
// with the matching route name and any parameters extracted from the hash.
//
// When an application decides that it wants to update the current hash, it can
// set the `current` property of the router to the name of a defined route and
// set any parameters necessary to generate the new hash. To actually modify the
// browser's hash, the `updateHash` method must be used. This is typically done
// during an application run loop. Calling the `updateHash` method will not
// trigger the router's callback.
//
// Routes are defined with a matcher regular expression and a generator
// function. The regular expression may contain capturing parenthesis, the
// captured values will be passed to the router's callback function along with
// the route name when a matching route is found. The generator function is used
// to construct a new hash when either the `current` or `params` properties
// change.
Z.Router = Z.Object.extend(Z.Observable, function() {
  // Internal: A regular expression that can be used to clean up a hash value.
  var stripHash = /^#|\/?$/;

  // Internal: The `current` property observer - simply clears the `params` hash
  // whenever `current` changes.
  //
  // Returns nothing.
  function currentDidChange() { this.params().clear(); }

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
    this.routeHash(this.location.hash);
  }

  // Public: The name of the current route. Updating this property an then
  // calling the `updateHash` method will cause the browser's location hash to
  // change.
  this.prop('current');

  // Public: A `Z.Hash` containing the parameters to use to generate the hash.
  this.prop('params');

  // Public: A computed property that returns a string to use as the browser's
  // location hash. The `updateHash` method must be called after this property
  // changes in order to actually update the browser's location hash.
  this.prop('hash', {
    dependsOn: ['current', 'params.@'],
    readonly: true,
    get: function() {
      var current = this.current(), params  = this.params().toNative();
      if (!current || !this.routes[current]) { return null; }
      return this.generate(current, params);
    }
  });

  // Public: The `Z.Router` constructor.
  //
  // callback - A function to invoke whenever the user changes the browser's
  //            location hash and a matching route is found. The name of the
  //            route and params extracted from the hash will be passed to this
  //            function.
  // errback  - A function to invoke when the user changes the browser's
  //            location hash to a value that does not match any routes. The
  //            hash value will be passed to this function.
  this.def('init', function(callback, errback,  opts) {
    this.routes   = {};
    this.callback = callback;
    this.errback  = errback;
    this.location = (opts && opts.location) || window.location;
    this.params(Z.H());
    this.supr();
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
  // Returns nothing.
  this.def('start', function() {
    this.observe('current', this, currentDidChange);
    this.observe('hash', this, hashDidChange);
    this.__hashChangeListener__ = Z.bind(processLocationHashChange, this);
    window.addEventListener('hashchange', this.__hashChangeListener__, false);
    this.__hashChangeListener__();
  });

  // Public: Stops the router by causing it to stop observing `hashchange`
  // events and changes to the `hash` property.
  //
  // Returns nothing.
  this.def('stop', function() {
    this.stopObserving('current', this, currentDidChange);
    this.stopObserving('hash', this, hashDidChange);
    window.removeEventListener('hashchange', this.__hashChangeListener__, false);
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
    var name, match;

    hash = hash.replace(stripHash, '');

    for (name in this.routes) {
      if (!this.routes.hasOwnProperty(name)) { continue; }

      if ((match = this.routes[name].matcher.exec(hash))) {
        this.callback(name, match.slice(1));
        return true;
      }
    }

    this.errback(hash);
    return false;
  });

  // Public: Sets the browser's location hash to the value of the `hash`
  // property if it has changed since the last time `updateHash` was called.
  this.def('updateHash', function() {
    var oldhash, newhash;
    if (!this.__needsUpdate__) { return; }

    oldhash = this.location.hash;
    newhash = this.hash();

    if (oldhash.replace(stripHash, '') !== newhash.replace(stripHash, '')) {
      this.__updatingHash__ = true;
      this.location.hash = newhash;
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

