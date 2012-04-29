(function() {

if (!this.Z) { require('./helper'); }

var MainView, TestView1;

TestView1 = Z.DOMView.extend(function() {
  this.prop('content');
  this.def('draw', function() {
    this.node().innerHTML = '<div class="test-view-1"><p class="foo"></p><p class="bar"></p></div>';
  });
});

MainView = Z.DOMView.extend(function() {
  this.def('initialize', function(props) {
    this.supr(props);
    this.subviews().push(TestView1.create(), TestView1.create());
  });
});

describe('Z.DOMView', function() {
  var container = document.createElement('div'), app;

  container.id = 'test-container';

  beforeEach(function() {
    document.body.appendChild(container);
    app = Z.DOMApp.create(MainView, container).start();
  });

  afterEach(function() {
    app.destroy();
    document.body.removeChild(container);
  });

  describe('.viewForNode', function() {
    it('should return the `Z.DOMView` object that owns the node', function() {
      var mainWindow = app.get('mainWindow'),
          mainView   = mainWindow.get('contentView'),
          testView1  = mainView.subviews().at(0),
          testView2  = mainView.subviews().at(1),
          foos       = document.querySelectorAll('.foo');

      expect(Z.DOMView.viewForNode(document.body)).toBeNull();
      expect(Z.DOMView.viewForNode(mainWindow.node())).toBe(mainWindow);
      expect(Z.DOMView.viewForNode(mainView.node())).toBe(mainView);
      expect(Z.DOMView.viewForNode(testView1.node())).toBe(testView1);
      expect(Z.DOMView.viewForNode(testView2.node())).toBe(testView2);
      expect(Z.DOMView.viewForNode(foos[0])).toBe(testView1);
      expect(Z.DOMView.viewForNode(foos[1])).toBe(testView2);
    });
  });
});

}());

