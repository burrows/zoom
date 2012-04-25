(function() {
  this.Z = this.Z || require('zoom-core');

  Test = {};

  Z.addNamespace(Test, 'Test');

  beforeEach(function() {
    return this.addMatchers({
      toEq: function(expected) {
          var toeq = this.isNot ? ' to not equal ' : ' to equal ';
        this.message = function() {
          return "Expected object " + Z.inspect(this.actual) + toeq + Z.inspect(expected);
        };
        return Z.eq(this.actual, expected);
      },

      toBe: function(expected) {
        this.message = function() {
          var tobe = this.isNot ? ' to not be ' : ' to be ';
          return "Expected object " + Z.inspect(this.actual) + tobe + Z.inspect(expected);
        };
        return this.actual === expected;
      }
    });
  });
}());

