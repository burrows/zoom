// Router
//   routes - hash mapping names to [regex, params] tuples
//   current - the name of the current route
//   params - hash mapping param names to values
//   hash - the current hash value of the window's url
//
// Scenarios:
//
// 1. some event triggers a state change
//   - when entering the new state, the enter method informs the router of the new route name
//   - the enter method may also specify route params
//   - the router observes changes to the current route and params, generates a new hash,
//     and updates the url bar
//   - entering further substates may specify additional params, which triggers the router
//     to regenerate the hash and set the url bar again
// 2. user changes the hash
//   - router listens for hashchange events
//   - router reads new hash and attempts to find a matching route
//   - router extracts params
//   - router sets new route
//   - router sets new params
//   - router sets new hash
//   - app observes changes to route and sends action to statechart
//     (didRouteTo<route name>), passing value of params
//   - statechart handler converts route name and params to new set of destination states
//   - statechart forcefully enters new destination states
// 3. app starts with a non-empty location hash
//   - when router is initialized, it reads the current hash value
//   - app tells statechart to go to default states
//   - app sends didRouteTo<route name> action to statechart based on current value of
//     route
//
// take a hash and match it to a named route and extract params
//   recognize(hash)
//    -> returns null if no routes match
//    -> return matching route name and params hash
// take a route name and params and generate hash
//   hashFor(route, params)
//    -> returns a string generated from the given route name and params
//
// Route
//   name - string
//   matcher - regex
//   params - array of parameter names
//   matches(hash) - returns a boolean
//   generate(params) - returns a url hash
//
//
// Router
//   updateHash - generates a url based on current and params and sets window.location.hash
//     - invoked by the app at the end of a run loop
(function() {

Z.Route = Z.Object.extend(function() {
  var namedRe  = /:\w+/g,
      splatRe  = /\*\w+/g,
      paramRe  = /[:*](\w+)/g,
      escapeRe = new RegExp("[-{}[\\]+?.,\\\\^$|#\\s]", 'g');

  function buildRegex(pattern) {
    pattern = pattern.replace(escapeRe, '\\$&')
                     .replace(namedRe, '([^\/]+)')
                     .replace(splatRe, '(.*?)');
    return new RegExp('^' + pattern + '$');
  }

  function extractParams(pattern) {
    var params = pattern.match(paramRe), i, len;

    if (!params) { return []; }

    for (i = 0, len = params.length; i < len; i++) {
      params[i] = params[i].slice(1);
    }

    return params;
  }

  this.def('init', function(name, pattern) {
    this.name    = name;
    this.pattern = pattern;
    this.matcher = buildRegex(pattern);
    this.params  = extractParams(pattern);
  });

  this.def('toStringProperties', function() {
    return this.supr().concat('name', 'pattern');
  });

  this.def('matchHash', function(hash) {
    var match = hash.match(this.matcher), params = {}, i, len;

    if (!match) { return null; }

    for (i = 1, len = match.length; i < len; i++) {
      params[this.params[i - 1]] = match[i];
    }

    return params;
  });

  this.def('matchParams', function(names) {
    return Z.eq(this.params.slice().sort(), names.slice().sort());
  });

  this.def('generate', function(params) {
    return this.pattern.replace(paramRe, function(match, name) {
      return params[name] || '';
    });
  });
});

Z.Router = Z.Object.extend(function() {
  function processHashChange() {
    var hash, match;

    if (this.__updatingHash__) { return this.__updatingHash__ = false; }

    hash  = this.location.hash.replace(/^#/, '');
    match = this.recognize(hash);

    if (match) { this.callback(match.route.name, match.params); }
  }

  this.prop('routes');
  this.prop('current');
  this.prop('params');

  this.prop('hash', {
    readonly: true,
    dependsOn: ['routes.@', 'current', 'params.@'],
    get: function() {
      var routes  = this.routes().toNative(),
          current = this.current(),
          params  = this.params(),
          names   = params.keys().toNative(),
          route, i, len;

      if (!current) { return null; }

      for (i = 0, len = routes.length; i < len; i++) {
        if (routes[i].name !== current) { continue; }
        if (routes[i].matchParams(names)) { route = routes[i]; break; }
      }

      if (!route) { return null; }

      return route.generate(params.toNative());
    }
  });

  this.def('init', function(callback, opts) {
    this.routes(Z.A());
    this.params(Z.H());
    this.callback = callback;
    this.location = (opts && opts.location) || window.location;
  });

  this.def('start', function() {
    this.__hashChangeListener__ = Z.bind(processHashChange, this);
    window.addEventListener('hashchange', this.__hashChangeListener__, false);
    this.__hashChangeListener__();
  });

  this.def('stop', function() {
    window.removeEventListener('hashchange', this.__hashChangeListener__, false);
  });

  this.def('route', function(name, pattern) {
    this.routes().push(Z.Route.create(name, pattern));
  });

  this.def('recognize', function(hash) {
    var routes = this.routes().toNative(), i, len, params;

    for (i = 0, len = routes.length; i < len; i++) {
      if ((params = routes[i].matchHash(hash))) {
        return {route: routes[i], params: params};
      }
    }

    return null;
  });

  this.def('updateHash', function() {
    var oldhash = this.location.hash.replace(/^#/, ''), newhash = this.hash();
    if (newhash && newhash !== oldhash) {
      this.__updatingHash__ = true;
      this.location.hash = newhash;
    }
  });
});

}());
