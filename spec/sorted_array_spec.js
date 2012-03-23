(function() {

if (typeof Z === 'undefined') { require('./helper'); }

describe('Z.SortedArray constructor', function() {
  describe('with no arguments', function() {
    it('should set the comparison function to `Z.cmp`', function() {
      var a = Z.SortedArray.create();
      expect(a.cmp).toBe(Z.cmp);
    });
  });

  describe('given a comparison function', function() {
    it('should set the comparison function to the given function', function() {
      var f = function() {}, a = Z.SortedArray.create(f);
      expect(a.cmp).toBe(f);
    });
  });
});

describe('Z.SortedArray.insert', function() {
  it('should maintain sorted order of the items as determined by the comparison function', function() {
    var a1 = Z.SortedArray.create(),
        a2 = Z.SortedArray.create(function(a, b) { return Z.cmp(b, a); });

    expect(a1.toArray()).toEq(Z.A());
    expect(a2.toArray()).toEq(Z.A());
    a1.insert(10);
    a2.insert(10);
    expect(a1.toArray()).toEq(Z.A(10));
    expect(a2.toArray()).toEq(Z.A(10));
    a1.insert(12);
    a2.insert(12);
    expect(a1.toArray()).toEq(Z.A(10, 12));
    expect(a2.toArray()).toEq(Z.A(12, 10));
    a1.insert(7);
    a2.insert(7);
    expect(a1.toArray()).toEq(Z.A(7, 10, 12));
    expect(a2.toArray()).toEq(Z.A(12, 10, 7));
    a1.insert(11);
    a2.insert(11);
    expect(a1.toArray()).toEq(Z.A(7, 10, 11, 12));
    expect(a2.toArray()).toEq(Z.A(12, 11, 10, 7));
  });
});

describe('Z.SortedArray.toArray', function() {
  it('should return a `Z.Array` object with the same contents', function() {
    var sa = Z.SortedArray.create(), a;

    sa.insert(5);
    sa.insert(3);
    sa.insert(12);

    a = sa.toArray();

    expect(a.isA(Z.Array)).toBe(true);
    expect(a).toEq(Z.A(3,5,12));
  });
});

describe('Z.SortedArray size property', function() {
  it('should be observable', function() {
    var notifications = [],
        a             = Z.SortedArray.create(),
        f             = function(n) { notifications.push(n); };

    a.observe('size', null, f, { previous: true, current: true });

    a.insert('foo');
    expect(notifications.length).toBe(1);
    expect(notifications[0].path).toBe('size');
    expect(notifications[0].previous).toBe(0);
    expect(notifications[0].current).toBe(1);
    a.insert('bar');
    expect(notifications.length).toBe(2);
    expect(notifications[1].path).toBe('size');
    expect(notifications[1].previous).toBe(1);
    expect(notifications[1].current).toBe(2);
    a.pop();
    expect(notifications.length).toBe(3);
    expect(notifications[2].path).toBe('size');
    expect(notifications[2].previous).toBe(2);
    expect(notifications[2].current).toBe(1);
  });
});

describe('Z.SortedArray first property', function() {
  it('should be observable', function() {
    var notifications = [],
        a             = Z.SortedArray.create(),
        f             = function(n) { notifications.push(n); };

    a.observe('first', null, f, { previous: true, current: true });

    a.insert('foo');
    expect(notifications.length).toBe(1);
    expect(notifications[0].path).toBe('first');
    expect(notifications[0].previous).toBe(null);
    expect(notifications[0].current).toBe('foo');
    a.insert('zebra');
    expect(notifications.length).toBe(1);
    a.insert('alpaca');
    expect(notifications.length).toBe(2);
    expect(notifications[1].path).toBe('first');
    expect(notifications[1].previous).toBe('foo');
    expect(notifications[1].current).toBe('alpaca');
  });
});

describe('Z.SortedArray last property', function() {
  it('should be observable', function() {
    var notifications = [],
        a             = Z.SortedArray.create(),
        f             = function(n) { notifications.push(n); };

    a.observe('last', null, f, { previous: true, current: true });

    a.insert('foo');
    expect(notifications.length).toBe(1);
    expect(notifications[0].path).toBe('last');
    expect(notifications[0].previous).toBe(null);
    expect(notifications[0].current).toBe('foo');
    a.insert('alpaca');
    expect(notifications.length).toBe(1);
    a.insert('zebra');
    expect(notifications.length).toBe(2);
    expect(notifications[1].path).toBe('last');
    expect(notifications[1].previous).toBe('foo');
    expect(notifications[1].current).toBe('zebra');
  });
});

describe('Z.SortedArray item observers', function() {
  var Foo = Z.Object.extend(function() {
    this.property('x');
    this.property('y');
  });

  it('should trigger notifications when observed keys on the array elements change', function() {
    var f1 = Foo.create({x: 1}),
        f2 = Foo.create({x: 2}),
        f3 = Foo.create({x: 3}),
        sa = Z.SortedArray.create(function(a, b) { return Z.cmp(a.x(), b.x()); }),
        notifications = [];

    sa.insert(f1);
    sa.insert(f2);
    sa.insert(f3);

    sa.observe('y', null, function(n) { notifications.push(n); }, {
      previous: true, current: true
    });

    f2.y('a');
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('change');
    expect(notifications[0].path).toBe('y');
    expect(notifications[0].previous).toEq(Z.A(null, null, null));
    expect(notifications[0].current).toEq(Z.A(null, 'a', null));
    f3.y('b');
    expect(notifications.length).toBe(2);
    expect(notifications[1].type).toBe('change');
    expect(notifications[1].path).toBe('y');
    expect(notifications[1].previous).toEq(Z.A(null, 'a', null));
    expect(notifications[1].current).toEq(Z.A(null, 'a', 'b'));
    f2.y('c');
    expect(notifications.length).toBe(3);
    expect(notifications[2].type).toBe('change');
    expect(notifications[2].path).toBe('y');
    expect(notifications[2].previous).toEq(Z.A(null, 'a', 'b'));
    expect(notifications[2].current).toEq(Z.A(null, 'c', 'b'));
  });
});

}());
