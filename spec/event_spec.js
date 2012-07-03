(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Event', function() {
  describe('.fromNative', function() {
    var window, view;

    beforeEach(function() {
      window = Z.Window.create(Z.View);
      view   = window.contentView();
    });

    afterEach(function() { window.destroy(); });

    it('should throw an exception when given an event of an unknown type', function() {
      expect(function() {
        Z.Event.fromNative({type: 'focus'});
      }).toThrow('Z.Event.fromNative: unknown native event type: focus');

      expect(function() {
        Z.Event.fromNative({type: 'mouseover'});
      }).toThrow('Z.Event.fromNative: unknown native event type: mouseover');
    });

    it('should return an instance of `Z.KeyEvent` when given a `keydown` native event', function() {
      var e = Z.Event.fromNative({type: 'keydown'});
      expect(e.isA(Z.KeyEvent)).toBe(true);
      expect(e.kind()).toBe(Z.KeyDown);
    });

    it('should return an instance of `Z.KeyEvent` when given a `keyup` native event', function() {
      var e = Z.Event.fromNative({type: 'keyup'});
      expect(e.isA(Z.KeyEvent)).toBe(true);
      expect(e.kind()).toBe(Z.KeyUp);
    });

    it('should return an instance of `Z.MouseEvent` when given a `mousemove` event', function() {
      var e = Z.Event.fromNative({type: 'mousemove', target: view.node()});
      expect(e.isA(Z.MouseEvent)).toBe(true);
      expect(e.kind()).toBe(Z.MouseMove);
    });

    it('should return an instance of `Z.MouseEvent` when given a `mousedown` event', function() {
      var e = Z.Event.fromNative({type: 'mousedown', target: view.node(), button: 0});
      expect(e.isA(Z.MouseEvent)).toBe(true);
      expect(e.kind()).toBe(Z.LeftMouseDown);
    });

    it('should return an instance of `Z.MouseEvent` when given a `mouseup` event', function() {
      var e = Z.Event.fromNative({type: 'mouseup', target: view.node(), button: 0});
      expect(e.isA(Z.MouseEvent)).toBe(true);
      expect(e.kind()).toBe(Z.LeftMouseUp);
    });

    it('should set the `window` property to the view owning the target of the mouse event', function() {
      var e = Z.Event.fromNative({type: 'mousedown', target: view.node(), button: 0});
      expect(e.window()).toBe(window);
    });

    it('should set the `kind` property to `Z.RightMouseDown` when the button is 2', function() {
      var e = Z.Event.fromNative({type: 'mousedown', target: view.node(), button: 2});
      expect(e.kind()).toBe(Z.RightMouseDown);
    });

    it('should set the `kind` property to `Z.OtherMouseDown` when the button is 1', function() {
      var e = Z.Event.fromNative({type: 'mousedown', target: view.node(), button: 1});
      expect(e.kind()).toBe(Z.OtherMouseDown);
    });
  });
});

}());
