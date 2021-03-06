(function() {

if (!this.Z) { require('./helper'); }

beforeEach(function() { Z.Model.reset(); });

Test.BasicModel = Z.Model.extend(function() {
  this.attr('foo', 'string');
  this.attr('bar', 'number');
  this.attr('baz', 'boolean');
  this.attr('bang', 'date');
});

Test.ValidatedModel = Z.Model.extend(function() {
  this.attr('foo', 'string');
  this.attr('bar', 'number');
  this.registerValidator('validatePresenceOfFoo');
  this.registerValidator('validateBarIsOver20');

  this.def('validatePresenceOfFoo', function() {
    if (!this.foo()) { this.addError('foo', 'foo must be present'); }
  });

  this.def('validateBarIsOver20', function() {
    var bar = this.bar();
    if (!bar || bar < 20) { this.addError('bar', 'bar must be over 20'); }
  });
});

Test.Author = Z.Model.extend(function() {
  this.attr('first', 'string');
  this.attr('last', 'string');
  this.hasMany('posts', 'Test.Post', {inverse: 'author'});
});

Test.Post = Z.Model.extend(function() {
  this.attr('title', 'string');
  this.attr('body', 'string');
  this.hasOne('author', 'Test.Author', {inverse: 'posts', owner: true});
  this.hasMany('tags', 'Test.Tag', {inverse: 'posts', owner: true});
});

Test.Tag = Z.Model.extend(function() {
  this.attr('name', 'string');
  this.hasMany('posts', 'Test.Post', {inverse: 'tags'});
});

Test.Parent = Z.Model.extend();
Test.Child  = Test.Parent.extend();

describe('Z.Model.attr', function() {
  it('should define a property with the given name', function() {
    expect(Test.BasicModel.hasProperty('foo')).toBe(true);
    expect(Test.BasicModel.create({foo: 'hello'}).foo()).toBe('hello');
    expect(Test.BasicModel.create({foo: 'goodbye'}).get('foo')).toBe('goodbye');
  });

  describe('generated property', function() {
    it('should return the value given by the `def` option is the attribute has not previously been set', function() {
      var Model = Z.Model.extend(function() {
        this.attr('foo', 'number', {def: 9});
        this.attr('bar', 'number');
      });

      expect(Model.create().foo()).toBe(9);
      expect(Model.create().bar()).toBeNull();
      expect(Model.create({foo: 8, bar: 12}).foo()).toBe(8);
      expect(Model.create({foo: 8, bar: 12}).bar()).toBe(12);
    });
  });

  describe('`string` type', function() {
    var x;

    beforeEach(function() { x = Test.BasicModel.create(); });

    it('should not transform string values', function() {
      x.set('foo', 'regular string');
      expect(x.get('foo')).toBe('regular string');
    });

    it('should allow setting `null`', function() {
      x.set('foo', 'a');
      expect(x.get('foo')).toBe('a');
      x.set('foo', null);
      expect(x.get('foo')).toBe(null);
    });

    it('should convert non-string, non-null values to a string using `toString`', function() {
      var Bar = Z.Object.extend(function() {
        this.def('toString', function() { return 'frobnob'; });
      });

      x.set('foo', 9);
      expect(x.get('foo')).toBe('9');
      x.set('foo', Bar.create());
      expect(x.get('foo')).toBe('frobnob');
    });
  });

  describe('`number` type', function() {
    var x;

    beforeEach(function() { x = Test.BasicModel.create(); });

    it('should not transform number values', function() {
      x.set('bar', 9);
      expect(x.get('bar')).toBe(9);
      x.set('bar', 9.12);
      expect(x.get('bar')).toBe(9.12);
    });

    it('should allow setting `null`', function() {
      x.set('bar', 8);
      expect(x.get('bar')).toBe(8);
      x.set('bar', null);
      expect(x.get('bar')).toBe(null);
    });

    it('should convert string values using `parseFloat`', function() {
      x.set('bar', '1234');
      expect(x.get('bar')).toBe(1234);
      x.set('bar', '88.88');
      expect(x.get('bar')).toBe(88.88);
    });
  });

  describe('`boolean` type', function() {
    var x;

    beforeEach(function() { x = Test.BasicModel.create(); });

    it('should convert values to booleans', function() {
      x.set('baz', true);
      expect(x.get('baz')).toBe(true);

      x.set('baz', false);
      expect(x.get('baz')).toBe(false);

      x.set('baz', 9);
      expect(x.get('baz')).toBe(true);

      x.set('baz', 0);
      expect(x.get('baz')).toBe(false);
    });

    it('should convert raw values to booleans', function() {
      var m = Test.BasicModel.load({id: 1, baz: null});
      expect(m.baz()).toBe(false);
      m = Test.BasicModel.load({id: 2, baz: 'true'});
      expect(m.baz()).toBe(true);
      m = Test.BasicModel.load({id: 2, baz: 'false'});
      expect(m.baz()).toBe(true);
      m = Test.BasicModel.load({id: 2, baz: 1});
      expect(m.baz()).toBe(true);
      m = Test.BasicModel.load({id: 2, baz: 0});
      expect(m.baz()).toBe(false);
    });
  });

  describe('`date` type', function() {
    var m;

    beforeEach(function() { m = Test.BasicModel.create(); });

    it('should convert valid ISO 8601 strings to a Date object', function() {
      m.bang('2012-10-03');
      expect(m.bang()).toEq(new Date(2012, 9, 3));
      m.bang('1998-01-05');
      expect(m.bang()).toEq(new Date(1998, 0, 5));
    });

    it('should throw an exception if given a string that is not ISO 8601 formatted', function() {
      expect(function() {
        m.bang('Oct 1, 2012');
      }).toThrow('Z.DateAttr.toRaw: could not convert string `Oct 1, 2012` to a Date');

      expect(function() {
        m.bang('2012-10-1');
      }).toThrow('Z.DateAttr.toRaw: could not convert string `2012-10-1` to a Date');

      expect(function() {
        m.bang('2012/10/01');
      }).toThrow('Z.DateAttr.toRaw: could not convert string `2012/10/01` to a Date');
    });

    it('should set the raw attribute to a ISO 8601 string', function() {
      m.bang(new Date(2012, 4, 18));
      expect(m.rawAttrs()['bang']).toBe('2012-05-18');
    });

    it('should convert numbers to a Date', function() {
      var s = new Date(2012, 6, 4).valueOf();

      m.bang(s);
      expect(m.bang()).toEq(new Date(2012, 6, 4));
    });

    it('should allow setting `null`', function() {
      expect(function() {
        m.bang(null);
      }).not.toThrow();
      expect(m.bang()).toBeNull();
    });
  });

  describe('`datetime` type', function() {
    var offset = (new Date()).getTimezoneOffset() * 60 * 1000, m;

    beforeEach(function() {
      m = Z.Model.extend(function() {
        this.attr('time', 'datetime');
      }).create();
    });

    it('should convert valid ISO 8601 strings to a Date object in the local timezone', function() {
      m.time("2013-03-29T09:49:30-05:00");
      expect(m.time()).toEq(new Date(Date.UTC(2013, 2, 29, 14, 49, 30, 0) + (5 * 60 * 60 * 1000) - offset));

      m.time("2013-03-29T09:49:30-06:00");
      expect(m.time()).toEq(new Date(Date.UTC(2013, 2, 29, 14, 49, 30, 0) + (6 * 60 * 60 * 1000) - offset));

      m.time("2013-03-29T09:49:30+02:00");
      expect(m.time()).toEq(new Date(Date.UTC(2013, 2, 29, 14, 49, 30, 0) - (2 * 60 * 60 * 1000) - offset));

      m.time("2013-03-29T09:49:30Z");
      expect(m.time()).toEq(new Date(Date.UTC(2013, 2, 29, 14, 49, 30, 0) - offset));

      m.time("2013-03-29T09:49:30");
      expect(m.time()).toEq(new Date(Date.UTC(2013, 2, 29, 14, 49, 30, 0) - offset));
    });

    it('should throw an exception if given a string that is not ISO 8601 formatted', function() {
      expect(function() {
        m.time('Oct 1, 2012');
      }).toThrow('Z.DateTimeAttr.toRaw: could not convert string `Oct 1, 2012` to a Date');

      expect(function() {
        m.time('2012-10-01 10:00:00');
      }).toThrow('Z.DateTimeAttr.toRaw: could not convert string `2012-10-01 10:00:00` to a Date');

      expect(function() {
        m.time('2012-10-01T10:00:00:00');
      }).toThrow('Z.DateTimeAttr.toRaw: could not convert string `2012-10-01T10:00:00:00` to a Date');
    });

    it('should set the raw attribute to a ISO 8601 string', function() {
      var d = new Date(2012, 4, 18, 8, 22, 11);
      m.time(d);
      expect(m.rawAttrs()['time']).toBe(Z.dateToISOString(d));
    });

    it('should convert numbers to a Date', function() {
      var d = new Date(2012, 6, 4, 12, 18, 21);

      m.time(d.valueOf());
      expect(m.time()).toEq(d);
    });

    it('should allow setting `null`', function() {
      expect(function() {
        m.time(null);
      }).not.toThrow();
      expect(m.time()).toBeNull();
    });
  });

  describe('`array` type', function() {
    var M = Z.Model.extend(function() {
      this.attr('numberArray', 'array', {itemType: 'number'})
      this.attr('dateArray', 'array', {itemType: 'date'})
    });

    it('should convert non-array values into one item arrays', function() {
      var m = M.create({numberArray: 4});
      expect(m.numberArray()).toEq([4]);
    });

    it('should convert Z.Array values into native arrays', function() {
      var m = M.create({numberArray: Z.A(1,2,3,4)});
      expect(m.numberArray()).toEq([1,2,3,4]);
    });

    it('should convert array items using the `itemType` converter', function() {
      var m = M.create({dateArray: ['2012-01-01', '2012-01-02', new Date(2012, 0, 3)]});
      expect(m.dateArray()).toEq([new Date(2012, 0, 1), new Date(2012, 0, 2), new Date(2012, 0, 3)]);
      expect(m.rawAttrs()['dateArray']).toEq(['2012-01-01', '2012-01-02', '2012-01-03']);
    });

    it('should throw an exception when given an invalid `itemType` name', function() {
      expect(function() {
        M.attr('foo', 'array', {itemType: 'foobar'});
      }).toThrow('Z.ArrayAttr.init: unknown attribute type: `foobar`');
    });

    it('should allow setting `null`', function() {
      var m = M.create();
      expect(function() {
        m.numberArray(null);
      }).not.toThrow();
      expect(m.numberArray()).toBeNull();
    });
  });
});

describe('Z.Model.attrNames', function() {
  it('should return the names of all attributes defined on the model', function() {
    expect(Test.BasicModel.attrNames().sort()).toEq(['bang', 'bar', 'baz', 'foo']);
  });
});

describe('Z.Model.attrs', function() {
  it('should return a raw object containing the values of each attribute', function() {
    var m = Test.BasicModel.create({foo: 'something', bar: 3.14, baz: false, bang: '2012-01-01'});
    expect(m.attrs()).toEq({foo: 'something', bar: 3.14, baz: false, bang: new Date(2012, 0, 1)});
  });
});

describe('Z.Model.empty', function() {
  it('should return an instance of the model with `sourceState` set to `EMPTY` and the given id', function() {
    var m = Test.BasicModel.empty(127);

    expect(m.id()).toBe(127);
    expect(m.sourceState()).toBe(Z.Model.EMPTY);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.load', function() {
  describe('attribute munging', function() {
    var M;

    beforeEach(function() {
      M = Z.Model.extend(function() {
        this.attr('foo', 'string');
      });
    });

    it("should pass the given attributes to the mapper's `mungeAttributes` method if it exists", function() {
      var attrs = {id: 1, foo: 'hello'};

      M.mapper = {mungeAttributes: function() {}};

      spyOn(M.mapper, 'mungeAttributes');

      M.load(attrs);

      expect(M.mapper.mungeAttributes).toHaveBeenCalledWith(M, attrs);
    });

    it('should use the updates made by the `mungeAttributes` mapper method', function() {
      var m;

      M.mapper = {
        mungeAttributes: function(type, attrs) {
          attrs.foo = attrs.foo.toUpperCase();
        }
      };

      m = M.load({id: 3, foo: 'hello'});
      expect(m.foo()).toBe('HELLO');
    });
  });

  describe('given attributes containing an id not in the identity map', function() {
    it('should return a new model instance with the given attributes', function() {
      var m = Test.BasicModel.load({ id: 126, foo: 's', bar: 1 });

      expect(m.type()).toBe(Test.BasicModel);
      expect(m.id()).toBe(126);
      expect(m.foo()).toBe('s');
      expect(m.bar()).toBe(1);
    });

    it('should add the new model instance to the identity map', function() {
      var m = Test.BasicModel.load({ id: 127, foo: 's', bar: 1 });

      expect(Test.BasicModel.fetch(127)).toBe(m);
    });

    it("should add the new model instance to the base type's `all` array", function() {
      var m;

      expect(Test.BasicModel.all()).toEq(Z.A());
      m = Test.BasicModel.load({ id: 111, foo: 's', bar: 1 });
      expect(Test.BasicModel.all()).toEq(Z.A(m));
    });

    it('should set `sourceState` to `LOADED`', function() {
      var m = Test.BasicModel.load({ id: 128, foo: 's', bar: 1 });
      expect(m.sourceState()).toBe(Z.Model.LOADED);
    });

    it('should set `isDirty`, `isInvalid`, and `isBusy` to `false`', function() {
      var m = Test.BasicModel.load({ id: 128, foo: 's', bar: 1 });
      expect(m.isDirty()).toBe(false);
      expect(m.isInvalid()).toBe(false);
      expect(m.isBusy()).toBe(false);
    });
  });

  describe('given attributes containing an id that is in the identity map', function() {
    it('should update and return the object that is already in the identity map', function() {
      var m = Test.BasicModel.load({ id: 200, foo: 's', bar: 1 }), m2;

      m2 = Test.BasicModel.load({ id: 200, foo: 's2', bar: 2 });

      expect(m2).toBe(m);
      expect(m.foo()).toBe('s2');
      expect(m.bar()).toBe(2);
    });

    it('should set the state to `LOADED`', function() {
      var m = Test.BasicModel.load({ id: 201, foo: 's', bar: 1 });

      m.foo('x');

      expect(m.isDirty()).toBe(true);

      Test.BasicModel.load({ id: 201, foo: 's3', bar: 3 });

      expect(m.sourceState()).toBe(Z.Model.LOADED);
      expect(m.isDirty()).toBe(false);
      expect(m.isInvalid()).toBe(false);
      expect(m.isBusy()).toBe(false);
    });

    describe('when the model in the identity map is empty', function() {
      it('should not throw an exception', function() {
        var m = Test.BasicModel.empty(19);

        expect(function() {
          Test.BasicModel.load({id: 19, foo: 'x', bar: 2});
        }).not.toThrow();

        expect(m.sourceState()).toBe(Z.Model.LOADED);
        expect(m.foo()).toBe('x');
        expect(m.bar()).toBe(2);
      });
    });
  });

  describe('given attributes that do not include an id', function() {
    it('should throw an exception', function() {
      expect(function() {
        Test.BasicModel.load({ foo: 's', bar: 1 });
      }).toThrow('Test.BasicModel.load: an `id` attribute is required');
    });
  });

  describe('given attributes containing a nested `hasOne` association', function() {
    it('should load the nested model and hook up the association', function() {
      var p = Test.Post.load({
        id: 184, title: 'the title', body: 'the body', author: {
          id: 9, first: 'Homer', last: 'Simpson'
        }
      });

      expect(p.author()).toBe(Test.Author.fetch(9));
      expect(p.get('author.id')).toBe(9);
      expect(p.get('author.first')).toBe('Homer');
      expect(p.get('author.last')).toBe('Simpson');
    });

    it('should not mark the associated model as `DIRTY` when it owns the association', function() {
      var a;

      Test.A = Z.Model.extend(function() {
        this.hasOne('b', 'Test.B', {inverse: 'a'});
      });

      Test.B = Z.Model.extend(function() {
        this.hasOne('a', 'Test.A', {inverse: 'b', owner: true});
      });

      a = Test.A.load({id: 1, b: {id: 9, a: 1}});

      expect(a.b().sourceState()).toBe(Z.Model.LOADED);
      expect(a.b().isDirty()).toBe(false);
      expect(a.b().isBusy()).toBe(false);
      expect(a.b().isInvalid()).toBe(false);

      Z.del(Test, 'A');
      Z.del(Test, 'B');
    });
  });

  describe('given attributes containing an id referece to a `hasOne` association', function() {
    describe('where the id exists in the identity map', function() {
      it('should hook up the association', function() {
        var a = Test.Author.load({id: 10, first: 'Bart', last: 'Simpson'}), p;

        expect(a.posts()).toEq(Z.A());
        p = Test.Post.load({id: 185, author: 10});
        expect(p.author()).toBe(a);
        expect(a.posts()).toEq(Z.A(p));
      });
    });

    describe('where the id does not exist in the identity map', function() {
      it('should create an empty instance of the associated object and hook up the association', function() {
        var p = Test.Post.load({id: 185, author: 11});

        expect(p.author().id()).toBe(11);
        expect(p.author().sourceState()).toBe(Z.Model.EMPTY);
        expect(p.author().posts()).toEq(Z.A(p));
      });
    });
  });

  describe('given attributes containing a nested `hasMany` association', function() {
    it('should load all of the nested models and hook up associations', function() {
      var p = Test.Post.load({
        id: 127, title: 'the title', body: 'the body',
        tags: [{id: 1, name: 'tag a'}, {id: 2, name: 'tag b'}]
      });

      expect(p.tags().at(0).id()).toBe(1);
      expect(p.tags().at(0).name()).toBe('tag a');
      expect(p.tags().at(0).posts()).toEq(Z.A(p));
      expect(p.tags().at(1).id()).toBe(2);
      expect(p.tags().at(1).name()).toBe('tag b');
      expect(p.tags().at(1).posts()).toEq(Z.A(p));
    });

    it('should remove existing associations that are not present in the given attributes', function() {
      var t1 = Test.Tag.load({id: 1, name: 'tag a'}),
          t2 = Test.Tag.load({id: 2, name: 'tag b'}),
          p  = Test.Post.load({id: 127, title: 'the title', body: 'the body', tags: [1, 2]});

      expect(p.tags()).toEq(Z.A(t1, t2));
      Test.Post.load({id: 127, title: 'the title', body: 'the body', tags: [2]});
      expect(p.tags()).toEq(Z.A(t2));
    });

    it('should not mark the associated models as `DIRTY` when they own the association', function() {
      var a;

      Test.A = Z.Model.extend(function() {
        this.hasMany('bs', 'Test.B', {inverse: 'a'});
      });

      Test.B = Z.Model.extend(function() {
        this.hasOne('a', 'Test.A', {inverse: 'bs', owner: true});
      });

      a = Test.A.load({id: 1, bs: [{id: 9, a: 1}, {id: 10, a: 1}]});

      expect(a.bs().at(0).sourceState()).toBe(Z.Model.LOADED);
      expect(a.bs().at(0).isDirty()).toBe(false);
      expect(a.bs().at(0).isBusy()).toBe(false);
      expect(a.bs().at(0).isInvalid()).toBe(false);
      expect(a.bs().at(1).sourceState()).toBe(Z.Model.LOADED);
      expect(a.bs().at(1).isDirty()).toBe(false);
      expect(a.bs().at(1).isBusy()).toBe(false);
      expect(a.bs().at(1).isInvalid()).toBe(false);

      Z.del(Test, 'A');
      Z.del(Test, 'B');
    });

    it('should not add a model to the hasMany association more than once', function() {
      var p = Test.Post.load({
        id: 127, title: 'the title', body: 'the body',
        tags: [{id: 1, name: 'tag a'}]
      });

      expect(p.get('tags.id')).toEq(Z.A(1));
      Test.Post.load({
        id: 127, title: 'the title', body: 'the body',
        tags: [{id: 1, name: 'tag a'}]
      });
      expect(p.get('tags.id')).toEq(Z.A(1));
    });
  });

  describe('given attributes containing a list of id refereces to a `hasMany` association', function() {
    describe('where the ids exist in the identity map', function() {
      it('should hook up the associations', function() {
        var t1 = Test.Tag.load({id: 324, name: 'blah'}),
            t2 = Test.Tag.load({id: 673, name: 'stuff'}),
            p;

        expect(t1.posts()).toEq(Z.A());
        expect(t2.posts()).toEq(Z.A());

        p = Test.Post.load({
          id: 127, title: 'the title', body: 'the body', tags: [324, 673]
        });

        expect(t1.posts()).toEq(Z.A(p));
        expect(t2.posts()).toEq(Z.A(p));
        expect(p.tags()).toEq(Z.A(t1, t2));
      });
    });

    describe('where the id does not exist in the identity map', function() {
      it('should create an empty instance of the associated models and hook up the associations', function() {
        var p = Test.Post.load({
          id: 127, title: 'the title', body: 'the body', tags: [32, 44]
        });

        expect(p.tags().at(0).id()).toBe(32);
        expect(p.tags().at(0).sourceState()).toBe(Z.Model.EMPTY);
        expect(p.tags().at(0).posts()).toEq(Z.A(p));
        expect(p.tags().at(1).id()).toBe(44);
        expect(p.tags().at(1).sourceState()).toBe(Z.Model.EMPTY);
        expect(p.tags().at(1).posts()).toEq(Z.A(p));
      });
    });
  });

  describe('given attributes containing a mixture of nested models and id references', function() {
    it('should create empty instances for the ids and hook up all associations', function() {
      var t1 = Test.Tag.load({id: 555, name: 'blah'}), p;

      p = Test.Post.load({
        id: 721, title: 'the title', body: 'the body',
        tags: [555, {id: 666, name: 'foo'}, 777]
      });

      expect(p.tags().at(0).id()).toBe(555);
      expect(p.tags().at(0).sourceState()).toBe(Z.Model.LOADED);
      expect(p.tags().at(0).posts()).toEq(Z.A(p));

      expect(p.tags().at(1).id()).toBe(666);
      expect(p.tags().at(1).sourceState()).toBe(Z.Model.LOADED);
      expect(p.tags().at(1).posts()).toEq(Z.A(p));

      expect(p.tags().at(2).id()).toBe(777);
      expect(p.tags().at(2).sourceState()).toBe(Z.Model.EMPTY);
      expect(p.tags().at(2).posts()).toEq(Z.A(p));

      expect(p.tags().pluck('id')).toEq(Z.A(555, 666, 777));
    });
  });
});

describe('Z.Model.find', function() {
  it('should throw an exception when called on a concrete instance', function() {
    var m = Test.BasicModel.create();

    expect(function() {
      m.find();
    }).toThrow('Z.Model.find: must be called on a model type');
  });

  it('should return a `Z.ModelArray`', function() {
    var ms = Test.BasicModel.find();
    expect(ms.isA(Z.ModelArray)).toBe(true);
  });

  it('should set the `modelType` property on the array to the receiver', function() {
    var ms = Test.BasicModel.find();
    expect(ms.modelType).toBe(Test.BasicModel);
  });

  it("should set the array's `isBusy` property to `true`", function() {
    var ms = Test.BasicModel.find();
    expect(ms.isBusy()).toBe(true);
  });
});

describe('Z.Model.init', function() {
  it('should set the given attributes', function() {
    var m = Test.BasicModel.create({ foo: 'abc', bar: 1 });

    expect(m.foo()).toBe('abc');
    expect(m.get('bar')).toBe(1);
  });

  it('should set `sourceState` to `NEW`', function() {
    var m = Test.BasicModel.create({ foo: 'abc', bar: 1 });

    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isDirty()).toBe(false);
    expect(m.isInvalid()).toBe(false);
    expect(m.isBusy()).toBe(false);
  });

  it('should allow setting non-attribute, non-association properties', function() {
    var Foo = Z.Model.extend(function() { this.prop('x'); });

    expect(Foo.create({x: 9}).x()).toBe(9);
  });

  it('should not throw an exception when given a key that does not match an attribute name', function() {
    var m;

    expect(function() {
      m = Test.BasicModel.create({ foo: 'abc', bar: 1, blah: 8 });
    }).not.toThrow();

    expect(m.foo()).toBe('abc');
    expect(m.bar()).toBe(1);
  });

  it('should allow setting associations', function() {
    var a  = Test.Author.create(),
        t1 = Test.Tag.create(),
        t2 = Test.Tag.create(),
        p  = Test.Post.create({author: a, tags: [t1, t2]});

    expect(p.author()).toBe(a);
    expect(p.tags()).toEq(Z.A(t1, t2));
  });
});

describe('Z.Model id property', function() {
  it('should throw an exception when setting it when it already has a non-null value', function() {
    var m = Test.BasicModel.create({ id: 1 });

    expect(m.id()).toBe(1);
    expect(function() {
      m.id(9);
    }).toThrow("Test.BasicModel.id (setter): overwriting a model's identity is not allowed: " + m.toString());
    expect(m.id()).toBe(1);
  });

  it('should add the model to the identity map once its been set for the first time', function() {
    var m = Test.BasicModel.create();

    m.set('id', 8734);
    expect(Test.BasicModel.fetch(8734)).toBe(m);
  });

  it("should add the model to the base type's `all` property once its been set for the first time", function() {
    var m = Test.BasicModel.create();
    expect(Test.BasicModel.all().contains(m)).toBe(false);
    m.set('id', 8735);
    expect(Test.BasicModel.all().contains(m)).toBe(true);
  });

  it('should throw an exception if a model with the same type and id already exists in the identity map', function() {
    var m = Test.BasicModel.load({id: 122});

    expect(function() {
      m = Test.BasicModel.create({id: 122});
    }).toThrow('Test.BasicModel: a model with the id `122` already exists');
  });
});

describe('Z.Model.fetch', function() {
  beforeEach(function() {
    spyOn(Test.BasicModel.mapper, 'fetchModel');
  });

  describe('for an id of a model that is already loaded into the identity map', function() {
    it('should return a reference to the already existing object', function() {
      var m = Test.BasicModel.load({id: 1234, foo: 'a', bar: 2});

      expect(Test.BasicModel.fetch(1234)).toBe(m);
    });
  });

  describe('for an id of a model that is not in the identity map', function() {
    it("should invoke the `fetchModel` method on the type's mapper", function() {
      var m = Test.BasicModel.fetch(18);
      expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
    });

    it('should return an instance of the model with `sourceState` set to `EMPTY` and `isBusy` set to `true`', function() {
      var m = Test.BasicModel.fetch(19);

      expect(m.type()).toBe(Test.BasicModel);
      expect(m.id()).toBe(19);

      expect(m.sourceState()).toBe(Z.Model.EMPTY);
      expect(m.isDirty()).toBe(false);
      expect(m.isInvalid()).toBe(false);
      expect(m.isBusy()).toBe(true);
    });

    it('should add the instance to the identity map', function() {
      var m = Test.BasicModel.fetch(20);
      expect(Test.BasicModel.fetch(20)).toBe(m);
    });

    it("should add the instance to the base type's `all` property", function() {
      var m = Test.BasicModel.fetch(20);
      expect(Test.BasicModel.all().contains(m)).toBe(true);
    });
  });

  describe('when called on a parent model type', function() {
    var p, c;

    beforeEach(function() {
      p = Test.Parent.load({id: 101});
      c = Test.Child.load({id: 201});
    });

    it('should find instances of the parent type', function() {
      expect(Test.Parent.fetch(101)).toBe(p);
    });

    it('should find instances of the child type', function() {
      expect(Test.Parent.fetch(201)).toBe(c);
    });
  });

  describe('when called on a child model type', function() {
    var p, c;

    beforeEach(function() {
      p = Test.Parent.load({id: 101});
      c = Test.Child.load({id: 201});
    });

    it('should find instances of the child type', function() {
      expect(Test.Child.fetch(201)).toBe(c);
    });

    it('should throw an exception if an instance with the given id is found but is an instance of the parent type', function() {
      expect(function() {
        Test.Child.fetch(101);
      }).toThrow('Test.Child.fetch: a model with id `101` was found in the identity map, but its prototype is `Test.Parent`');
    });
  });
});

describe('Z.Model.fetchModelDidSucceed', function() {
  it('should set `sourceState` to `LOADED`', function() {
    var m = Test.BasicModel.fetch(22);

    expect(m.sourceState()).toBe(Z.Model.EMPTY);
    m.fetchModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
  });

  it('should set `isBusy` to `false`', function() {
    var m = Test.BasicModel.fetch(22);

    expect(m.isBusy()).toBe(true);
    m.fetchModelDidSucceed();
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.fetchModelDidFail', function() {
  it('should set `isBusy` to `false`', function() {
    var m;

    spyOn(Test.BasicModel.mapper, 'fetchModel');

    m = Test.BasicModel.fetch(1);

    expect(m.isBusy()).toBe(true);
    m.fetchModelDidFail();
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.refresh', function() {
  var m;

  beforeEach(function() {
    spyOn(Test.BasicModel.mapper, 'fetchModel');
    m = Test.BasicModel.load({id: 34});
  });

  it("should invoke the mapper's `fetchModel` method", function() {
    m.refresh();
    expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
  });

  it("should forward any arguments on to the mapper's `fetchModel` method", function() {
    m.refresh(9, 10);
    expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m, 9, 10);
  });

  it("should return the receiver", function() {
    expect(m.refresh()).toBe(m);
  });

  it("should set `isBusy` to `true`", function() {
    expect(m.isBusy()).toBe(false);
    m.refresh();
    expect(m.isBusy()).toBe(true);
  });

  it('should throw an exception when called on a `NEW` model', function() {
    m = Test.BasicModel.create();

    expect(function() {
      m.refresh();
    }).toThrow("Test.BasicModel.refresh: can't refresh a model in the NEW state: " + m.toString());
  });

  it('should throw an exception when called on an `BUSY` model', function() {
    m.refresh();
    expect(m.isBusy()).toBe(true);

    expect(function() {
      m.refresh();
    }).toThrow("Test.BasicModel.refresh: can't refresh a model in the LOADED-BUSY state: " + m.toString());
  });

  it('should throw an exception when called on a `DESTROYED` model', function() {
    m.destroy().destroyModelDidSucceed();
    expect(function() {
      m.refresh();
    }).toThrow("Test.BasicModel.refresh: can't refresh a model in the DESTROYED state: " + m.toString());
  });
});

describe('Z.Model getting attributes', function() {
  beforeEach(function() {
    spyOn(Test.BasicModel.mapper, 'fetchModel');
  });

  describe('for an `EMPTY` model', function() {
    it('should invoke `fetchModel` on the mapper', function() {
      var m = Test.BasicModel.empty(945);

      m.foo();
      expect(Test.BasicModel.mapper.fetchModel).toHaveBeenCalledWith(m);
    });

    it('should set `isBusy` to `true`', function() {
      var m = Test.BasicModel.empty(945);
      expect(m.isBusy()).toBe(false);
      m.foo();
      expect(m.isBusy()).toBe(true);
    });

    it('should not invoke `fetchModel` when the model is already busy', function() {
      var m = Test.BasicModel.empty(945);

      m.foo();
      m.bar();
      expect(Test.BasicModel.mapper.fetchModel.callCount).toBe(1);
    });
  });
});

describe('Z.Model setting attributes', function() {
  describe('for a `NEW` model', function() {
    it('should not set `isDirty`', function() {
      var m = Test.BasicModel.create();

      expect(m.sourceState()).toBe(Z.Model.NEW);
      expect(m.isDirty()).toBe(false);
      m.set('foo', 'hello');
      expect(m.sourceState()).toBe(Z.Model.NEW);
      expect(m.isDirty()).toBe(false);
    });

    it('should not create the `changes` hash', function() {
      var m = Test.BasicModel.create();
      expect(m.get('changes')).toBeNull();
      m.set('bar', 9);
      expect(m.get('changes')).toBeNull();
    });
  });

  describe('for a `LOADED` model', function() {
    it('should set `isDirty`', function() {
      var m = Test.BasicModel.load({id: 121});

      expect(m.sourceState()).toBe(Z.Model.LOADED);
      expect(m.isDirty()).toBe(false);
      m.set('foo', 'hello');
      expect(m.sourceState()).toBe(Z.Model.LOADED);
      expect(m.isDirty()).toBe(true);
    });

    it("should create the `changes` hash containing the changed attribute's previous value", function() {
      var m = Test.BasicModel.load({id: 123, bar: 8});

      expect(m.get('changes')).toBeNull();
      m.set('bar', 9);
      expect(m.get('changes')).not.toBeNull();
      expect(m.get('changes').type()).toBe(Z.Hash);
      expect(m.get('changes.bar')).toBe(8);
    });

    it('should only add the attribute to the `changes` hash if it has yet to be changed', function() {
      var m = Test.BasicModel.load({id: 123, foo: 'a', bar: 8});

      m.set('foo', 'b');
      expect(m.get('changes.foo')).toBe('a');
      m.set('foo', 'c');
      expect(m.get('changes.foo')).toBe('a');

      m.set('bar', 9);
      expect(m.get('changes.bar')).toBe(8);
      m.set('bar', 10);
      expect(m.get('changes.bar')).toBe(8);
    });
  });
});

describe('Z.Model.save', function() {
  beforeEach(function() {
    spyOn(Z.Model.mapper, 'createModel');
    spyOn(Z.Model.mapper, 'updateModel');
  });

  it("should invoke the mapper's `createModel` method when the model state is `NEW`", function() {
    var m = Test.BasicModel.create({id: 1, foo: 'x', bar: 9 });

    expect(m.sourceState()).toBe(Z.Model.NEW);
    m.save();
    expect(Test.BasicModel.mapper.createModel).toHaveBeenCalledWith(m);
    expect(Test.BasicModel.mapper.updateModel).not.toHaveBeenCalled();
  });

  it('should forward the context argument on to the `createModel` method', function() {
    var m = Test.BasicModel.create({id: 1, foo: 'x', bar: 9 });

    expect(m.sourceState()).toBe(Z.Model.NEW);
    m.save('foo');
    expect(Test.BasicModel.mapper.createModel).toHaveBeenCalledWith(m, 'foo');
    expect(Test.BasicModel.mapper.updateModel).not.toHaveBeenCalled();
  });

  it("should invoke the mapper's `updateModel` method when the model is `DIRTY`", function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x', bar: 9 });

    m.foo('y');
    expect(m.isDirty()).toBe(true);
    m.save();
    expect(Test.BasicModel.mapper.createModel).not.toHaveBeenCalled();
    expect(Test.BasicModel.mapper.updateModel).toHaveBeenCalledWith(m);
  });

  it('should forward any arguments on to the `updateModel` method', function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x', bar: 9 });

    m.foo('y');
    expect(m.isDirty()).toBe(true);
    m.save('a');
    expect(Test.BasicModel.mapper.createModel).not.toHaveBeenCalled();
    expect(Test.BasicModel.mapper.updateModel).toHaveBeenCalledWith(m, 'a');
  });

  it("should do nothing for a model that is invalid", function() {
    var m = Test.ValidatedModel.load({id: 1, foo: 'x', bar: 22 });

    m.set('bar', 1);
    expect(m.isInvalid()).toBe(false);
    m.save();
    expect(m.isInvalid()).toBe(true);

    expect(Test.BasicModel.mapper.createModel).not.toHaveBeenCalled();
    expect(Test.BasicModel.mapper.updateModel).not.toHaveBeenCalled();
  });

  it('should pass the context argument on to the validate method', function() {
    var m = Test.ValidatedModel.load({id: 1, foo: 'x', bar: 22 });
    m.set('bar', 1);
    spyOn(m, 'validate')
    m.save('something');
    expect(m.validate).toHaveBeenCalledWith('something');
  });

  it('should return true when validation passes', function() {
    var m = Test.ValidatedModel.load({id: 1, foo: 'x', bar: 22 });
    expect(m.save()).toBe(true);
    expect(m.isInvalid()).toBe(false);
  });

  it('should return false when the validation fails', function() {
    var m = Test.ValidatedModel.load({id: 1, foo: 'x', bar: 22 });
    m.set('bar', 1);
    expect(m.save()).toBe(false);
    expect(m.isInvalid()).toBe(true);
  });

  it('should throw an exception for a model that is `BUSY`', function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x'});

    m.foo('y');
    m.save();

    expect(m.isBusy()).toBe(true);

    expect(function() {
      m.save();
    }).toThrow("Test.BasicModel.save: can't save a model in the LOADED-DIRTY-BUSY state: " + m.toString());
  });

  it('should throw an exception for a model that is `DESTROYED`', function() {
    var m = Test.BasicModel.load({id: 1, foo: 'x', bar: 2});

    m.destroy().destroyModelDidSucceed(1);
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);

    expect(function() {
      m.save();
    }).toThrow("Test.BasicModel.save: can't save a model in the DESTROYED state: " + m.toString());
  });

  it('should throw an exception for a model that is `EMPTY`', function() {
    var m = Test.BasicModel.empty(88);

    expect(function() {
      m.save();
    }).toThrow("Test.BasicModel.save: can't save a model in the EMPTY state: " + m.toString());
  });
});

describe('Z.Model.createModelDidSucceed', function() {
  it('should set `sourceState` to `LOADED` and `isBusy` to `false`', function() {
    var m = Test.BasicModel.create({foo: 'x', bar: 2});

    m.save();
    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isBusy()).toBe(true);
    m.createModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.createModelDidFail', function() {
  it('should `isBusy` to `false`', function() {
    var m = Test.BasicModel.create({foo: 'x', bar: 2});

    m.save();
    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isBusy()).toBe(true);
    m.createModelDidFail();
    expect(m.sourceState()).toBe(Z.Model.NEW);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.updateModelDidSucceed', function() {
  it('should set `isDirty` and `isBusy` to `false`', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.save();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.updateModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(false);
    expect(m.isBusy()).toBe(false);
  });

  it('should clear the `changes` hash', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.set('bar', 3);
    m.save();

    expect(m.get('changes.size')).toBe(2);
    m.updateModelDidSucceed();
    expect(m.get('changes.size')).toBe(0);
  });
});

describe('Z.Model.updateModelDidFail', function() {
  it('should set `isBusy` to `false`', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.save();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.updateModelDidFail();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isBusy()).toBe(false);
  });

  it('should not clear the `changes` hash', function() {
    var m = Test.BasicModel.load({id: 224, foo: 'x', bar: 2});

    m.set('foo', 'a');
    m.set('bar', 3);
    m.save();

    expect(m.get('changes.size')).toBe(2);
    m.updateModelDidFail();
    expect(m.get('changes.size')).toBe(2);
  });
});

describe('Z.Model.destroy', function() {
  var m;

  beforeEach(function() {
    m = Test.BasicModel.load({id: 144});
    spyOn(Test.BasicModel.mapper, 'destroyModel');
  });

  it("should invoke the mapper's `destroyModel` method", function() {
    m.destroy();
    expect(m.mapper.destroyModel).toHaveBeenCalledWith(m);
  });

  it("should pass the context argument on to the mapper's `destroyModel` method", function() {
    m.destroy('foo');
    expect(m.mapper.destroyModel).toHaveBeenCalledWith(m, 'foo');
  });

  it('should set `isBusy` to `true`', function() {
    expect(m.isBusy()).toBe(false);
    m.destroy();
    expect(m.isBusy()).toBe(true);
  });

  it('should work when the model state is `EMPTY`', function() {
    m = Test.BasicModel.empty(447);

    m.destroy();

    expect(m.mapper.destroyModel).toHaveBeenCalledWith(m);
    expect(m.isBusy()).toBe(true);
  });

  it('should not invoke the mapper `destroyModel` method when the model state is `NEW`', function() {
    m = Test.BasicModel.create();

    m.destroy();

    expect(m.mapper.destroyModel).not.toHaveBeenCalled();
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isBusy()).toBe(false);
  });

  it('should do nothing when the model state is `DESTROYED`', function() {
    m.destroy().destroyModelDidSucceed();

    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isBusy()).toBe(false);

    m.destroy();

    expect(m.mapper.destroyModel.callCount).toBe(1);
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isBusy()).toBe(false);
  });

  it('should throw an exception when the model is `BUSY`', function() {
    m.refresh();

    expect(m.isBusy()).toBe(true);

    expect(function() {
      m.destroy();
    }).toThrow("Test.BasicModel.destroy: can't destroy a model in the LOADED-BUSY state: " + m.toString());
  });
});

describe('Z.Model.destroyModelDidSucceed', function() {
  it('should set the state to `DESTROYED` and clear `isDirty`, `isBusy` and `isInvalid`', function() {
    var m = Test.ValidatedModel.load({id: 144, foo: 'hey', bar: 222});

    m.bar(9);
    m.validate();
    m.destroy();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isInvalid()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.destroyModelDidSucceed();
    expect(m.sourceState()).toBe(Z.Model.DESTROYED);
    expect(m.isDirty()).toBe(false);
    expect(m.isInvalid()).toBe(false);
    expect(m.isBusy()).toBe(false);
  });

  it('should remove the object from the identity map', function() {
    var m = Test.BasicModel.load({id: 888}), m2;

    m.destroy();
    expect(Test.BasicModel.fetch(888)).toBe(m);
    m.destroyModelDidSucceed();
    m2 = Test.BasicModel.fetch(888);
    expect(m2).not.toBe(m);
    expect(m2.sourceState()).toBe(Z.Model.EMPTY);
  });

  it("should remove the object from the base type's `all` property", function() {
    var m = Test.BasicModel.load({id: 888}), m2;

    expect(Test.BasicModel.all().contains(m)).toBe(true);
    m.destroy();
    m.destroyModelDidSucceed();
    expect(Test.BasicModel.all().contains(m)).toBe(false);
  });

  it('should remove the model from any associations', function() {
    var p = Test.Post.load({
      id: 184, title: 'the title', body: 'the body',
      author: { id: 9, first: 'Homer', last: 'Simpson' },
      tags: [ { id: 18, name: 'the tag' } ]
    }), a = p.author(), t = p.tags().first();

    expect(a.posts()).toEq(Z.A(p));
    expect(t.posts()).toEq(Z.A(p));

    p.destroy().destroyModelDidSucceed();

    expect(a.posts()).toEq(Z.A());
    expect(t.posts()).toEq(Z.A());
  });
});

describe('Z.Model.destroyModelDidFail', function() {
  it('should not change the state and clear `isBusy`', function() {
    var m = Test.ValidatedModel.load({id: 144, foo: 'hey', bar: 222});

    m.bar(9);
    m.validate();
    m.destroy();

    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isInvalid()).toBe(true);
    expect(m.isBusy()).toBe(true);
    m.destroyModelDidFail();
    expect(m.sourceState()).toBe(Z.Model.LOADED);
    expect(m.isDirty()).toBe(true);
    expect(m.isInvalid()).toBe(true);
    expect(m.isBusy()).toBe(false);
  });
});

describe('Z.Model.undoChanges', function() {
  describe('on a new model', function() {
    it('should do nothing', function() {
      var m = Test.BasicModel.create({foo: 'v', bar: 12});

      m.undoChanges();
      expect(m.sourceState()).toBe(Z.Model.NEW);
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });
  });

  describe('on a clean model', function() {
    it('should do nothing', function() {
      var m = Test.BasicModel.load({id: 5, foo: 'v', bar: 12});

      m.undoChanges();
      expect(m.isDirty()).toBe(false);
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });
  });

  describe('on a destroyed model', function() {
    it('throw an exception', function() {
      var m = Test.BasicModel.load({id: 5, foo: 'v', bar: 12});

      m.destroy().destroyModelDidSucceed();

      expect(m.sourceState()).toBe(Z.Model.DESTROYED);

      expect(function() {
        m.undoChanges();
      }).toThrow("Test.BasicModel.undoChanges: attempted to undo changes on a DESTROYED model: " + m.toString());
    });
  });

  describe('on a dirty model', function() {
    var m;

    beforeEach(function() {
      m = Test.BasicModel.load({id: 5, foo: 'v', bar: 12});
      m.foo('x');
      m.bar(21);
    });

    it('should set all attribute values back to their original state', function() {
      m.undoChanges();
      expect(m.foo()).toBe('v');
      expect(m.bar()).toBe(12);
    });

    it('should clear the `changes` hash', function() {
      expect(m.get('changes.size')).toBe(2);
      m.undoChanges();
      expect(m.get('changes.size')).toBe(0);
    });

    it('should clear the `errors` hash', function() {
      var m = Test.ValidatedModel.load({id: 12});
      m.bar(9);

      m.validate();
      expect(m.get('errors.size') > 0).toBe(true);
      m.undoChanges();
      expect(m.get('errors.size')).toBe(0);
    });

    it('should clear the `errors` hash even when the model is not dirty', function() {
      var m = Test.ValidatedModel.load({id: 12});
      m.validate();
      expect(m.get('errors.size') > 0).toBe(true);
      expect(m.isDirty()).toBe(false);
      m.undoChanges();
      expect(m.get('errors.size')).toBe(0);
    });

    it('should set `isDirty` to `false`', function() {
      expect(m.isDirty()).toBe(true);
      m.undoChanges();
      expect(m.isDirty()).toBe(false);
    });
  });
});

describe('Z.Model.addError', function() {
  var m;

  beforeEach(function() {
    m = Test.ValidatedModel.load({id: 9, foo: 'hey', bar: 99});
  });

  it("should create the `errors` hash if it doesn't exist", function() {
    expect(m.errors()).toBeNull();
    m.addError('foo', 'blah');
    expect(m.errors()).not.toBeNull();
  });

  it("should push the given message onto an array keyed by the given attribute name", function() {
    m.addError('foo', 'blah');
    expect(m.errors().at('foo')).toEq(Z.A('blah'));
    m.addError('foo', 'something');
    expect(m.errors().at('foo')).toEq(Z.A('blah', 'something'));
  });

  it('should set `isInvalid` to `true`', function() {
    expect(m.isInvalid()).toBe(false);
    m.addError('foo', 'this is an error');
    expect(m.isInvalid()).toBe(true);
  });
});

describe('Z.Model.validate', function() {
  var m, inlineValidatorRan, inlineValidatorThis;

  Test.ValidatedModel.open(function() {
    this.registerValidator(function() {
      inlineValidatorRan  = true;
      inlineValidatorThis = this;
    });

    this.registerValidator('validateX', {context: 'x'});
    this.registerValidator('validateY', {context: 'y'});

    this.def('validateX', function() {});
    this.def('validateY', function() {});
  });

  beforeEach(function() {
    m = Test.ValidatedModel.load({id: 4, foo: 'xyz', bar: 76});
    inlineValidatorRan  = false;
    inlineValidatorThis = null;
  });

  it('should run all registered validators without a context option', function() {
    spyOn(m, 'validatePresenceOfFoo');
    spyOn(m, 'validateBarIsOver20');

    m.validate();

    expect(m.validatePresenceOfFoo).toHaveBeenCalled();
    expect(m.validateBarIsOver20).toHaveBeenCalled();
    expect(inlineValidatorRan).toBe(true);
    expect(inlineValidatorThis).toBe(m);
  });

  it('should only run validations with a context option when the option matches the context passed to validate', function() {
    spyOn(m, 'validateX');
    spyOn(m, 'validateY');

    m.validate();
    expect(m.validateX).not.toHaveBeenCalled();
    expect(m.validateY).not.toHaveBeenCalled();
    m.validateX.reset();
    m.validateY.reset();

    m.validate('x');
    expect(m.validateX).toHaveBeenCalled();
    expect(m.validateY).not.toHaveBeenCalled();
    m.validateX.reset();
    m.validateY.reset();

    m.validate('y');
    expect(m.validateX).not.toHaveBeenCalled();
    expect(m.validateY).toHaveBeenCalled();
  });

  it('should set `isInvalid` if any validators add an error to the `errors` hash', function() {
    expect(m.isInvalid()).toBe(false);
    m.validate();
    expect(m.errors()).toBeNull();
    expect(m.isInvalid()).toBe(false);
    m.foo(null);
    m.validate();
    expect(m.errors().size()).toBe(1);
    expect(m.isInvalid()).toBe(true);
    m.bar(8);
    m.validate();
    expect(m.errors().size()).toBe(2);
    expect(m.isInvalid()).toBe(true);
  });

  it('should unset `isInvalid` if none of the validators add to the `errors` hash', function() {
    m.foo(null);
    m.bar(8);

    m.validate();
    expect(m.errors().size()).toBe(2);
    expect(m.isInvalid()).toBe(true);

    m.foo('a');
    m.bar(21);
    m.validate();
    expect(m.errors().size()).toBe(0);
    expect(m.isInvalid()).toBe(false);
  });

  it('should clear any existing errors', function() {
    var M = Z.Model.extend(), m = M.create();

    m.addError('foo', 'some error');
    expect(m.errors().size()).toBe(1);
    m.validate();
    expect(m.errors().size()).toBe(0);
  });

  it('should unset `isInvalid` even when there are no validators', function() {
    var M = Z.Model.extend(), m = M.create();

    m.addError('foo', 'some error');
    expect(m.isInvalid()).toBe(true);
    m.validate();
    expect(m.isInvalid()).toBe(false);
  });

  describe('with conditional validators', function() {
    var A = Z.Model.extend(function() {
      this.registerValidator('validatorA', { 'if': 'shouldValidate'});
      this.registerValidator('validatorB', { unless: function() {
        return this.shouldntValidate();
      }});

      this.prop('shouldValidate');
      this.prop('shouldntValidate');
      this.attr('foo', 'number');

      this.def('validatorA', function() {});
      this.def('validatorB', function() {});
    });

    it('should run an `if` validator if the given method returns a truthy value', function() {
      var m = A.create();

      spyOn(m, 'validatorA');

      m.shouldValidate(true);
      m.validate();
      expect(m.validatorA).toHaveBeenCalled();
    });

    it('should not run an `if` validator if the given method returns a falsy value', function() {
      var m = A.create();

      spyOn(m, 'validatorA');

      m.shouldValidate(false);
      m.validate();
      expect(m.validatorA).not.toHaveBeenCalled();
    });

    it('should run an `unless` validator if the given method returns a falsy value', function() {
      var m = A.create();

      spyOn(m, 'validatorB');

      m.shouldntValidate(false);
      m.validate();
      expect(m.validatorB).toHaveBeenCalled();
    });

    it('should not run an `unless` validator if the given method returns a truthy value', function() {
      var m = A.create();

      spyOn(m, 'validatorB');

      m.shouldntValidate(true);
      m.validate();
      expect(m.validatorB).not.toHaveBeenCalled();
    });
  });
});

describe('Z.Model.reset', function() {
  it('should remove all objects from the identity map', function() {
    var m = Test.BasicModel.create({id: 1111});

    expect(Test.BasicModel.fetch(1111)).toBe(m);
    Z.Model.reset();
    expect(Test.BasicModel.fetch(1111)).not.toBe(m);
  });

  it("should clear all type's `all` properties", function() {
    Test.BasicModel.create({id: 1111});
    Test.BasicModel.create({id: 2222});

    expect(Test.BasicModel.get('all.size')).toBe(2);
    Z.Model.reset();
    expect(Test.BasicModel.get('all.size')).toBe(0);
  });
});

describe('Z.Model.toString', function() {
  describe('given an `EMPTY` model', function() {
    it('should display the type name, state, and id', function() {
      expect(Test.BasicModel.empty(123).toString()).toBe('#<Test.BasicModel (EMPTY) id: 123>');
      expect(Test.BasicModel.empty('foo').toString()).toBe("#<Test.BasicModel (EMPTY) id: 'foo'>");
    });
  });

  describe('given a `LOADED` model', function() {
    it('should display the type name, state, id, attributes, and associated object ids', function() {
      var a1 = Test.Author.load({id: 3, first: 'Marge', last: 'Simpson'}),
          a2 = Test.Author.load({
            id: 4, first: 'Lisa', last: 'Simpson',
            posts: [
              {id: 9, title: 'the title', body: 'the body', tags: []},
              {id: 10, title: 'another title', body: 'some body', tags: []}
            ]
          });

      expect(a1.toString()).toMatch(/^#<Test.Author \(LOADED\) id: 3/);
      expect(a1.toString()).toMatch(/first: 'Marge'/);
      expect(a1.toString()).toMatch(/last: 'Simpson'/);
      expect(a1.toString()).toMatch(/posts: \[\]/);

      expect(a2.toString()).toMatch(/^#<Test.Author \(LOADED\) id: 4[^>]/);
      expect(a2.toString()).toMatch(/posts: \[9, 10\]/);

      expect(a2.posts().first().toString()).toMatch(/^#<Test.Post \(LOADED\) id: 9[^>]/);
      expect(a2.posts().first().toString()).toMatch(/author: 4/);
    });
  });
});

describe('Z.Model `hasOne` association', function() {
  describe('with no inverse and `owner` option set to `false`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {owner: false});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should create a property with the given name', function() {
      expect(Test.Foo.hasProperty('bar')).toBe(true);
    });

    it('should initialize the `hasOne` property to `null`', function() {
      expect(Test.Foo.create().bar()).toBe(null);
    });

    it('should not mark the model as `DIRTY` when setting the hasOne side', function() {
      var f = Test.Foo.load({id: 91}), b = Test.Bar.create({id: 121});

      expect(f.isDirty()).toBe(false);
      f.bar(b);
      expect(f.isDirty()).toBe(false);
    });

    it('should not mark the model as `DIRTY` when unsetting the hasOne side', function() {
      var f = Test.Foo.load({id: 91}), b = Test.Bar.create({id: 121});

      expect(f.isDirty()).toBe(false);
      f.bar(b);
      expect(f.isDirty()).toBe(false);
      f.bar(null);
      expect(f.isDirty()).toBe(false);
    });

    it('should throw an exception when setting an object of the wrong type', function() {
      var baz = Z.Model.extend().create(), f = Test.Foo.create();

      expect(function() {
        f.bar(baz);
      }).toThrow(Z.fmt('Test.Foo.bar: expected an object of type `Test.Bar` but received %@ instead', baz));
    });
  });

  describe('with no inverse and `owner` option set to `true`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {owner: true});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should mark the model as `DIRTY` when setting', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bar(Test.Bar.create());
      expect(f.isDirty()).toBe(true);
    });

    it('should mark the model as `DIRTY` when clearing', function() {
      var f = Test.Foo.load({id: 12}), b = Test.Bar.load({id: 19});

      f.bar(b);
      f.save();
      f.updateModelDidSucceed();

      expect(f.isDirty()).toBe(false);
      f.bar(null);
      expect(f.isDirty()).toBe(true);
    });
  });

  describe('with `hasOne` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {inverse: 'foo'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasOne('foo', 'Test.Foo', {inverse: 'bar'});
      });
    });

    it('should set the receiver as the inverse when setting', function() {
      var f1 = Test.Foo.create(),
          f2 = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

      f1.bar(b1);
      expect(b1.foo()).toBe(f1);

      b2.foo(f2);
      expect(b2.foo()).toBe(f2);
    });

    it('should clear both sides of the association when setting one side to `null`', function() {
      var f = Test.Foo.create(), b = Test.Bar.create();

      f.bar(b);
      expect(f.bar()).toBe(b);
      expect(b.foo()).toBe(f);
      f.bar(null);
      expect(f.bar()).toBe(null);
      expect(b.foo()).toBe(null);
    });
  });

  describe('with `hasMany` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasOne('bar', 'Test.Bar', {inverse: 'foos'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasMany('foos', 'Test.Foo', {inverse: 'bar'});
      });
    });

    it('should add the receiver to the inverse array when setting', function() {
      var f1 = Test.Foo.create(), f2 = Test.Foo.create(), b = Test.Bar.create();

      f1.bar(b);
      expect(b.foos()).toEq(Z.A(f1));
      f2.bar(b);
      expect(b.foos()).toEq(Z.A(f1, f2));
    });

    it('should remove the receiver from teh inverse array when clearing', function() {
      var f1 = Test.Foo.create(), f2 = Test.Foo.create(), b = Test.Bar.create();

      f1.bar(b);
      f2.bar(b);

      expect(b.foos()).toEq(Z.A(f1, f2));

      f1.bar(null);
      expect(b.foos()).toEq(Z.A(f2));
      f2.bar(null);
      expect(b.foos()).toEq(Z.A());
    });
  });
});

describe('Z.Model `hasMany` association', function() {
  describe('with no inverse and `owner` option set to `false`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {owner: false});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should create a property with the given name', function() {
      expect(Test.Foo.hasProperty('bars')).toBe(true);
    });

    it('should initialize the `hasMany` property to an empty `Z.Array`', function() {
      expect(Test.Foo.create().bars()).toEq(Z.A());
    });

    it('should replace all items in the array when the given items when set', function() {
      var f  = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create(),
          b3 = Test.Bar.create(),
          b4 = Test.Bar.create();

      f.bars().push(b1);
      expect(f.bars()).toEq(Z.A(b1));
      f.bars([b2, b3]);
      expect(f.bars()).toEq(Z.A(b2, b3));
      f.bars(Z.A(b1, b4));
      expect(f.bars()).toEq(Z.A(b1, b4));
    });

    it('should not mark the model as `DIRTY` when adding objects', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bars().push(Test.Bar.create());
      expect(f.isDirty()).toBe(false);
    });

    it('should not mark the model as `DIRTY` when removing objects', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bars().push(Test.Bar.create());
      expect(f.isDirty()).toBe(false);
      f.bars().pop();
      expect(f.isDirty()).toBe(false);
    });

    it('should throw an exception when adding objects of the wrong type', function() {
      var baz = Z.Model.extend().create(), f = Test.Foo.create();

      expect(function() {
        f.bars().push(baz);
      }).toThrow(Z.fmt('Test.Foo.bars: expected an object of type `Test.Bar` but received %@ instead', baz));
    });
  });

  describe('with no inverse and `owner` option set to `true`', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {owner: true});
      });

      Test.Bar = Z.Model.extend();
    });

    it('should mark the model as `DIRTY` when adding objects', function() {
      var f = Test.Foo.load({id: 12});

      expect(f.isDirty()).toBe(false);
      f.bars().push(Test.Bar.create());
      expect(f.isDirty()).toBe(true);
    });

    it('should mark the model as `DIRTY` when removing objects', function() {
      var f = Test.Foo.load({id: 12}), b = Test.Bar.load({id: 19});

      f.bars().push(b);
      f.save();
      f.updateModelDidSucceed();

      expect(f.isDirty()).toBe(false);
      f.bars().pop();
      expect(f.isDirty()).toBe(true);
    });
  });

  describe('with `hasOne` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {inverse: 'foo'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasOne('foo', 'Test.Foo', {inverse: 'bars'});
      });
    });

    it('should set the inverse on the hasOne side when adding to the hasMany side', function() {
      var f = Test.Foo.create(), b1 = Test.Bar.create(), b2 = Test.Bar.create();

      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
      f.bars().push(b1);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
    });

    it('should clear the inverse on the hasOne side when removing from the hasMany side', function() {
      var f = Test.Foo.create(), b1 = Test.Bar.create(), b2 = Test.Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars().pop();
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(null);
    });

    it('should clear the inverse on the hasOne side when the hasMany side is cleared', function() {
      var f = Test.Foo.create(), b1 = Test.Bar.create(), b2 = Test.Bar.create();

      f.bars().push(b1);
      f.bars().push(b2);
      expect(b1.foo()).toBe(f);
      expect(b2.foo()).toBe(f);
      f.bars().clear();
      expect(b1.foo()).toBe(null);
      expect(b2.foo()).toBe(null);
    });
  });

  describe('with `hasMany` inverse', function() {
    beforeEach(function() {
      Test.Foo = Z.Model.extend(function() {
        this.hasMany('bars', 'Test.Bar', {inverse: 'foos'});
      });

      Test.Bar = Z.Model.extend(function() {
        this.hasMany('foos', 'Test.Foo', {inverse: 'bars'});
      });
    });

    it('should add to the other side when an object is added', function() {
      var f1 = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

      expect(f1.bars()).toEq(Z.A());
      expect(b1.foos()).toEq(Z.A());
      expect(b2.foos()).toEq(Z.A());

      f1.bars().push(b1);

      expect(f1.bars()).toEq(Z.A(b1));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A());

      f1.bars().push(b2);

      expect(f1.bars()).toEq(Z.A(b1, b2));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A(f1));
    });

    it('should remove from the other side when an object is added', function() {
      var f1 = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

      f1.bars().push(b1);
      f1.bars().push(b2);

      expect(f1.bars()).toEq(Z.A(b1, b2));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A(f1));

      f1.bars().pop();

      expect(f1.bars()).toEq(Z.A(b1));
      expect(b1.foos()).toEq(Z.A(f1));
      expect(b2.foos()).toEq(Z.A());

      b1.foos().pop();

      expect(f1.bars()).toEq(Z.A());
      expect(b1.foos()).toEq(Z.A());
      expect(b2.foos()).toEq(Z.A());
    });

    it('should properly set the other side when an existing associated model removed and added in a call to `repalce`', function() {
      var f  = Test.Foo.create(),
          b1 = Test.Bar.create(),
          b2 = Test.Bar.create();

      f.bars().push(b1, b2);

      expect(f.bars()).toEq(Z.A(b1, b2));
      expect(b1.foos()).toEq(Z.A(f));
      expect(b2.foos()).toEq(Z.A(f));

      f.bars().replace([b2, b1]);

      expect(f.bars()).toEq(Z.A(b2, b1));
      expect(b1.foos()).toEq(Z.A(f));
      expect(b2.foos()).toEq(Z.A(f));
    });
  });
});

describe('Z.Model.modelAncestors', function() {
  describe('when called on a direct sub-prototype of `Z.Model`', function() {
    it('should return an array containing the sub-prototype', function() {
      var M = Z.Model.extend();
      expect(M.modelAncestors()).toEq([M]);
    });

    it('should not include any modules mixed in to the prototype', function() {
      var M = Z.Model.extend(Z.Orderable);
      expect(M.modelAncestors()).toEq([M]);
    });
  });

  describe('when called on a prototype that descends from a direct sub-prototype of `Z.Model`', function() {
    it('should return an array containing the receiver and its parent prototype', function() {
      var A = Z.Model.extend(), B = A.extend();
      expect(B.modelAncestors()).toEq([B, A]);
    });

    it('should not include any modules mixed in at any level', function() {
      var M1 = Z.Module.extend(), M2 = Z.Module.extend(), A = Z.Model.extend(M1), B = A.extend(M2);
      expect(B.modelAncestors()).toEq([B, A]);
    });
  });
});

describe('Z.Model.baseType', function() {
  it("should return the direct sub-prototype of `Z.Model` from the given object's inheritance chain", function() {
    var A = Z.Model.extend(), B = A.extend(Z.Orderable), C = B.extend();

    expect(A.baseType()).toBe(A);
    expect(B.baseType()).toBe(A);
    expect(C.baseType()).toBe(A);
    expect(C.create().baseType()).toBe(A);
  });
});

}());
