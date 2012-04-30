(function() {
  if (!this.window) {
    this.window   = require('domino').createWindow();
    this.document = window.document;
  }

  this.Z = this.Z || require('zoom');

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

  this.simulateMouseEvent = function(type, elem) {
    var evt = document.createEvent('MouseEvents');

    evt.initMouseEvent(type, true, true, window,
      0, 0, 0, 0, 0, false, false, false, false, 0, null);

    elem.dispatchEvent(evt);
  };

  this.simulateMouseEvent = function(element, event, opts){
    var evt;

    opts = opts || {};

    if (document.createEventObject) { // dispatch for IE
      evt = document.createEventObject();
      return element.fireEvent('on'+event, evt)
    }
    else { // dispatch for firefox + others
      evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(
        event,              // type
        true,               // canBubble
        true,               // cancelable
        window,             // view
        0,                  // detail
        0,                  // screenX
        0,                  // screenY
        opts.clientX || 0,  // clientX
        opts.clientY || 0,  // clientY
        false,              // ctrlKey
        false,              // altKey
        false,              // shiftKey
        false,              // metaKey
        0,                  // button
        opts.relatedTarget || null); // relatedTarget

      return !element.dispatchEvent(evt);
    }
  };
}());

