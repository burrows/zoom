(function() {
  var root = typeof exports !== 'undefined' ? global : window;

  root.Z = root.Z || require('zoom');

  beforeEach(function() {
    return this.addMatchers({
      toEq: function(expected) {
        this.message = function() {
          return "Expected object " + Z.toString(this.actual) + " to eq " + Z.toString(expected);
        };
        return Z.eq(this.actual, expected);
      }
    });
  });
}());

