(function() {
  var root = typeof exports !== 'undefined' ? global : window;

  root.Z = root.Z || require('zoom');

  beforeEach(function() {
    return this.addMatchers({
      toEq: function(expected) {
        this.message = function() {
          return "Expected object " + Z.inspect(this.actual) + " to eq " + Z.inspect(expected);
        };
        return Z.eq(this.actual, expected);
      }
    });
  });
}());

