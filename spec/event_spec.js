(function() {

if (!this.Z) { require('./helper'); }

describe('Z.EventListener', function() {
  var container, listener;

  beforeEach(function() {
    container = document.createElement('div');
    document.body.appendChild(container);
    listener = Z.EventListener.create(container);
  });

  afterEach(function() {
    listener.destroy();
    document.body.removeChild(container);
  });

  describe('mouse event listener', function() {
    it("should observe events on the container, create `Z.MouseEvent` objects and set them to the `event` property", function() {
      expect(listener.event()).toBe(null);

      simulateMouseEvent(container, 'mousedown');
      expect(listener.event()).not.toBe(null);
      expect(listener.event().isA(Z.MouseEvent)).toBe(true);
      expect(listener.event().kind).toBe(Z.LeftMouseDown);

      simulateMouseEvent(container, 'mouseup');
      expect(listener.event().isA(Z.MouseEvent)).toBe(true);
      expect(listener.event().kind).toBe(Z.LeftMouseUp);

      simulateMouseEvent(container, 'mousemove');
      expect(listener.event().isA(Z.MouseEvent)).toBe(true);
      expect(listener.event().kind).toBe(Z.MouseMove);
    });
  });

  describe('destroy', function() {
    it('should teardown event handlers', function() {
      expect(listener.event()).toBe(null);
      listener.destroy();
      simulateMouseEvent(container, 'mousedown');
      expect(listener.event()).toBe(null);
    });
  });
});

}());
