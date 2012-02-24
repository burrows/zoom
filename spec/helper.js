(function() {
  var root = typeof exports !== 'undefined' ? global : window;

  root.Z = root.Z || require('zoom');
  root.Test = root.Test || {};

  Z.addNamespace(Test, 'Test');

  beforeEach(function() {
    return this.addMatchers({
      toEq: function(expected) {
        this.message = function() {
          return "Expected object " + Z.inspect(this.actual) + " to eq " + Z.inspect(expected);
        };
        return Z.eq(this.actual, expected);
      },

      toBe: function(expected) {
        this.message = function() {
          return "Expected object " + Z.inspect(this.actual) + " to be " + Z.inspect(expected);
        };
        return this.actual === expected;
      }
    });
  });
}());

