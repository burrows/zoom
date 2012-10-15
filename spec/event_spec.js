(function() {

if (!this.Z) { require('./helper'); }

describe('Z.EventListener', function() {
  var events, container, listener;

  beforeEach(function() {
    events = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    listener = Z.EventListener.create(container, function(e) {
      events.push(e);
    });
  });

  afterEach(function() {
    listener.destroy();
    document.body.removeChild(container);
  });

  describe('mouse event listener', function() {
    it("should observe events on the container, create `Z.MouseEvent` objects and pass them to the given callback", function() {
      simulateMouseEvent(container, 'mousedown');
      expect(events[0]).not.toBe(null);
      expect(events[0].isA(Z.MouseEvent)).toBe(true);
      expect(events[0].kind).toBe(Z.LeftMouseDown);

      simulateMouseEvent(container, 'mouseup');
      expect(events[1].isA(Z.MouseEvent)).toBe(true);
      expect(events[1].kind).toBe(Z.LeftMouseUp);

      simulateMouseEvent(container, 'mousemove');
      expect(events[2].isA(Z.MouseEvent)).toBe(true);
      expect(events[2].kind).toBe(Z.MouseMove);
    });
  });

  describe('destroy', function() {
    it('should teardown event handlers', function() {
      listener.destroy();
      simulateMouseEvent(container, 'mousedown');
      expect(events.length).toBe(0);
    });
  });
});

}());
