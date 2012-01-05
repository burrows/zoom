(function() {

var Z = this.Z || require('zoom');

describe('Z.Model many-to-one association', function() {
  var Foo, Bar;

  Foo = Z.Model.extend(function() {
    this.hasMany('bars', 'Bar', { inverse: 'foo' });
  });

  Bar = Z.Model.extend(function() {
    this.hasOne('foo', 'Foo', { inverse: 'bars' });
  });

  beforeEach(function() {
    Z.root.Foo = Foo;
    Z.root.Bar = Bar;
  });

  afterEach(function() {
    delete Z.root.Foo;
    delete Z.root.Bar;
  });

  it('should create properties on each side of the association', function() {
    expect(Foo.hasProperty('bars')).toBe(true);
    expect(Bar.hasProperty('foo')).toBe(true);
  });

  it('should initialize hasMany property to an empty Z.Array', function() {
    expect(Foo.create().bars()).toEq(Z.A());
  });

  it('should initialize hasOne property to null', function() {
    expect(Bar.create().foo()).toBe(null);
  });

  describe('adding objects to the hasMany side', function() {
    it('should set the inverse on the hasOne side if the `inverse` option is set on the hasMany side', function() {
      var f = Foo.create(), b1 = Bar.create(), b2 = Bar.create();

      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
      f.bars().push(b1);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
    });
  });

  describe('removing objects to the hasMany side', function() {
    it('should clear the inverse on the hasOne side', function() {
    });
  });

  describe('replacing the Z.Array object on the hasMany side', function() {
    it('should clear the inverse on all items in the old array', function() {
    });

    it('should set the inverse on all items in the new array', function() {
    });
  });

});

}());
