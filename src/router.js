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
//
// Route
//   name - string
//   matcher - regex
//   params - array of parameter names
//   matches(hash) - returns a boolean
//   generate(params) - returns a url hash
//
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

  this.def('init', function(pattern) {
    this.pattern = pattern;
    this.matcher = buildRegex(pattern);
    this.params  = extractParams(pattern);
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
    return Z.eq(this.params.sort(), names.sort());
  });

  this.def('generate', function(params) {
    return this.pattern.replace(paramRe, function(match, name) {
      return params[name] || '';
    });
  });
});

}());
