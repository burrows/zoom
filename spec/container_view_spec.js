(function() {

if (!this.Z) { require('./helper'); }

var TestView1, TestView2;

TestView1 = Z.View.extend(function() {
  this.def('classes', function() { return this.supr().concat('test-view-1') });
});

TestView2 = Z.View.extend(function() {
  this.def('classes', function() { return this.supr().concat('test-view-2') });
});

describe('Z.ContainerView', function() {
  describe('.init with a `contentView` property that is not a `Z.View` instance', function() {
    it('should throw an exception', function() {
      var o = Z.Object.create();

      expect(function() {
        Z.ContainerView.create({contentView: o});
      }).toThrow(Z.fmt("Z.ContainerView: `contentView` must be a Z.View instance: %@", o));
    });
  });

  describe('.init with a `contentView` property', function() {
    it('should add the view as a subview', function() {
      var tv = TestView1.create(),
          cv = Z.ContainerView.create({contentView: tv});

      expect(cv.get('subviews.size')).toBe(1);
      expect(cv.get('subviews.first')).toBe(tv);
    });
  });

  describe('.init with a `nowShowing` property that is not a Z.View', function() {
    it('should throw an exception', function() {
      var o = Z.Object.create();

      expect(function() {
        Z.ContainerView.create({nowShowing: o});
      }).toThrow(Z.fmt("Z.ContainerView: `nowShowing` must be a Z.View: %@", o));
    });
  });

  describe('.init with a string `nowShowing` property', function() {
    it('should resolve the string and set it as the `contentView`', function() {
      var cv;

      Test.testView1 = TestView1.create();
      cv = Z.ContainerView.create({nowShowing: 'Test.testView1'});
      expect(cv.contentView()).toBe(Test.testView1);
      delete Test.testView1;

      Test.TestView1 = TestView1;
      cv = Z.ContainerView.create({nowShowing: 'Test.TestView1'});
      expect(cv.contentView().isA(TestView1)).toBe(true);
      delete Test.TestView1;
    });
  });

  describe('.init with a Z.View `nowShowing` property', function() {
    it('should set the view as the `contentView`', function() {
      var tv = TestView1.create(), cv;

      cv = Z.ContainerView.create({nowShowing: TestView1});
      expect(cv.contentView().isA(TestView1)).toBe(true);

      cv = Z.ContainerView.create({nowShowing: tv});
      expect(cv.contentView()).toBe(tv);
    });
  });

  describe('changing the `contentView` property', function() {
    it('should remove the previous subview and add the new subview', function() {
      var tv1 = TestView1.create(),
          tv2 = TestView2.create(),
          cv  = Z.ContainerView.create({contentView: tv1});

      expect(cv.get('subviews.size')).toBe(1);
      expect(cv.get('subviews.first')).toBe(tv1);
      cv.contentView(tv2);
      expect(cv.get('subviews.size')).toBe(1);
      expect(cv.get('subviews.first')).toBe(tv2);
    });

    it('should destroy the previous subview', function() {
      var tv1 = TestView1.create(),
          tv2 = TestView2.create(),
          cv  = Z.ContainerView.create({contentView: tv1});

      spyOn(tv1, 'destroy');
      cv.contentView(tv2);
      expect(tv1.destroy).toHaveBeenCalled();
    });

    it('should remove all subviews when set to `null`', function() {
      var cv = Z.ContainerView.create({contentView: TestView1.create()});

      expect(cv.get('subviews.size')).toBe(1);
      cv.contentView(null);
      expect(cv.get('subviews.size')).toBe(0);
    });
  });

  describe('changing the `nowShowing` property', function() {
    var tv1, cv;

    beforeEach(function() {
      tv1 = TestView1.create()
      cv  = Z.ContainerView.create({contentView: tv1});
    });

    it('should resolve a string to a view type, instantiate the type, and set the instance as the `contentView`', function() {
      Test.TestView2 = TestView2;
      cv.nowShowing('Test.TestView2');
      expect(cv.contentView().isA(TestView2)).toBe(true);
      delete Test.TestView2;
    });

    it('should instantiate a view type and set the instance as the `contentView`', function() {
      cv.nowShowing(TestView2);
      expect(cv.contentView().isA(TestView2)).toBe(true);
    });

    it('should set the given view instance as the `contentView`', function() {
      var tv2 = TestView2.create();
      cv.nowShowing(tv2);
      expect(cv.contentView()).toBe(tv2);
    });
  });
});

}());

