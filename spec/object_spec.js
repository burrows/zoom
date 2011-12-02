(function() {
  var Z, root;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Z = this.Z || require('zoom');

  root = Z.root;

  describe('Z.Object', function() {
    return it('should be defined', function() {
      return expect(Z.Object).toBeDefined();
    });
  });

  describe('Z.Object constructor', function() {
    it('should assign an auto-incrementing id to each new instance, accessible via the objectId property', function() {
      var o1, o2, o3;
      o1 = new Z.Object;
      o2 = new Z.Object;
      o3 = new Z.Object;
      expect(typeof o1.objectId()).toBe('number');
      expect(typeof o2.get('objectId')).toBe('number');
      expect(typeof o3.objectId()).toBe('number');
      expect(o1.objectId() < o2.objectId()).toBe(true);
      return expect(o2.get('objectId') < o3.get('objectId')).toBe(true);
    });
    return it('should set all given properties when passed a native object', function() {
      var Foo, f;
      Foo = (function() {

        __extends(Foo, Z.Object);

        function Foo() {
          Foo.__super__.constructor.apply(this, arguments);
        }

        Foo.property('a');

        Foo.property('b');

        return Foo;

      })();
      f = new Foo;
      expect(f.a()).toBeUndefined();
      expect(f.b()).toBeUndefined();
      f = new Foo({
        a: 1
      });
      expect(f.a()).toBe(1);
      expect(f.b()).toBeUndefined();
      f = new Foo({
        a: 1,
        b: 2
      });
      expect(f.a()).toBe(1);
      return expect(f.b()).toBe(2);
    });
  });

  describe('Z.Object.className', function() {
    beforeEach(function() {
      Z.Stuff = (function() {

        __extends(Stuff, Z.Object);

        function Stuff() {
          Stuff.__super__.constructor.apply(this, arguments);
        }

        return Stuff;

      })();
      root.MyNamespace = {};
      return MyNamespace.Thing = (function() {

        __extends(Thing, Z.Object);

        function Thing() {
          Thing.__super__.constructor.apply(this, arguments);
        }

        return Thing;

      })();
    });
    afterEach(function() {
      delete Z.Stuff;
      return delete root.MyNamespace;
    });
    it('should return the name of the class for classes in the Z namespace', function() {
      expect(Z.Object.className()).toBe('Z.Object');
      return expect(Z.Stuff.className()).toBe('Z.Stuff');
    });
    it('should return the name of the class for classes in the global namespace', function() {
      root.Global = (function() {

        __extends(Global, Z.Object);

        function Global() {
          Global.__super__.constructor.apply(this, arguments);
        }

        return Global;

      })();
      expect(Global.className()).toBe('Global');
      return delete root.Global;
    });
    it('should return "(Unknown)" for classes not defined in a namespace', function() {
      var SomeClass;
      SomeClass = (function() {

        __extends(SomeClass, Z.Object);

        function SomeClass() {
          SomeClass.__super__.constructor.apply(this, arguments);
        }

        return SomeClass;

      })();
      return expect(SomeClass.className()).toBe('(Unknown)');
    });
    it('should return "(Unknown)" for classes defined in a namespace other than Z but not registered', function() {
      return expect(MyNamespace.Thing.className()).toBe('(Unknown)');
    });
    return it('should return the name of the class for classes defined in a namespace other than Z that is registered', function() {
      Z.Object.addNamespace(MyNamespace, 'MyNamespace');
      expect(MyNamespace.Thing.className()).toBe('MyNamespace.Thing');
      return Z.Object.removeNamespace(MyNamespace);
    });
  });

  describe('Z.Object.toString', function() {
    return it('should return a string containing the class name, object id and current property values', function() {
      var f, o;
      root.Foo = (function() {

        __extends(Foo, Z.Object);

        function Foo() {
          Foo.__super__.constructor.apply(this, arguments);
        }

        Foo.property('a');

        Foo.property('b');

        return Foo;

      })();
      o = new Z.Object;
      f = new Foo({
        a: 9,
        b: 'xyz'
      });
      expect(o.toString()).toEqual("#<Z.Object:" + (o.objectId()) + ">");
      return expect(f.toString()).toEqual("#<Foo:" + (f.objectId()) + " @a=9, @b=xyz>");
    });
  });

  describe('Z.Object.isEqual', function() {
    it('should return true if the objects are identical', function() {
      var o;
      o = new Z.Object;
      return expect(o.isEqual(o)).toBe(true);
    });
    return it('should return false if the objects are not identical', function() {
      var o1, o2;
      o1 = new Z.Object;
      o2 = new Z.Object;
      expect(o1.isEqual(o2)).toBe(false);
      expect(o1.isEqual(8)).toBe(false);
      expect(o1.isEqual({})).toBe(false);
      return expect(o1.isEqual([])).toBe(false);
    });
  });

  describe('Z.Object.property', function() {
    var Person;
    Person = (function() {

      __extends(Person, Z.Object);

      function Person() {
        Person.__super__.constructor.apply(this, arguments);
      }

      Person.property('firstName');

      return Person;

    })();
    it('should define an instance method with the given name', function() {
      var p;
      p = new Person;
      return expect(typeof p.firstName).toEqual('function');
    });
    return describe('generated instance method', function() {
      it('should set a private property when passed an argument', function() {
        var p;
        p = new Person;
        expect(p.__firstName__).toBeUndefined();
        p.firstName('Corey');
        return expect(p.__firstName__).toEqual('Corey');
      });
      return it('should return the private property value when passed no arguments', function() {
        var p;
        p = new Person;
        expect(p.firstName()).toBeUndefined();
        p.firstName('Nicole');
        return expect(p.firstName()).toEqual('Nicole');
      });
    });
  });

  describe('Z.Object.hasProperty', function() {
    var A, B;
    A = (function() {

      __extends(A, Z.Object);

      function A() {
        A.__super__.constructor.apply(this, arguments);
      }

      A.property('foo');

      return A;

    })();
    B = (function() {

      __extends(B, A);

      function B() {
        B.__super__.constructor.apply(this, arguments);
      }

      B.property('bar');

      return B;

    })();
    it('should return true if a property with the given name exists on the class', function() {
      expect(A.hasProperty('foo')).toBe(true);
      return expect(B.hasProperty('bar')).toBe(true);
    });
    it('should return true if a property with the given name exists on a superclass', function() {
      return expect(B.hasProperty('foo')).toBe(true);
    });
    return it('should return false if a property with the given does not exist on the class', function() {
      expect(A.hasProperty('idontexist')).toBe(false);
      return expect(A.hasProperty('bar')).toBe(false);
    });
  });

  describe('Z.Object KVC support:', function() {
    var Person;
    Person = (function() {

      __extends(Person, Z.Object);

      function Person() {
        Person.__super__.constructor.apply(this, arguments);
      }

      Person.property('firstName');

      Person.property('points', {
        get: function() {
          return this._POINTS_;
        },
        set: function(v) {
          return this._POINTS_ = v;
        }
      });

      return Person;

    })();
    describe('#set when given a key', function() {
      describe('for a property using the default setter', function() {
        return it('should set a private property name on the receiver', function() {
          var p;
          p = new Person;
          expect(p.__firstName__).toBeUndefined();
          p.set('firstName', 'Nicole');
          return expect(p.__firstName__).toEqual('Nicole');
        });
      });
      describe('for a property using a custom setter', function() {
        return it('should invoke the given setter function', function() {
          var p;
          p = new Person;
          expect(p._POINTS_).toBeUndefined();
          expect(p.__points__).toBeUndefined();
          p.set('points', 18);
          expect(p._POINTS_).toEqual(18);
          return expect(p.__points__).toBeUndefined();
        });
      });
      it('should return null', function() {
        var p;
        p = new Person;
        expect(p.set('firstName', 'Bob')).toBeNull();
        return expect(p.set('points', 9)).toBeNull();
      });
      it('should set all of the properties when given a hash', function() {
        var p;
        p = new Person;
        p.set({
          firstName: 'Joe',
          points: 12
        });
        expect(p.get('firstName')).toBe('Joe');
        return expect(p.get('points')).toBe(12);
      });
      return it('should invoke setUnknownProperty, passing the name and value if a property with the given name does not exist', function() {
        var p;
        p = new Person;
        spyOn(p, 'setUnknownProperty');
        p.set('doesntExist', 1);
        return expect(p.setUnknownProperty).toHaveBeenCalledWith('doesntExist', 1);
      });
    });
    describe('#get when given a key', function() {
      describe('for a property using the default getter', function() {
        return it('should get a private property name on the receiver', function() {
          var p;
          p = new Person;
          p.set('firstName', 'George');
          expect(p.__firstName__).toEqual('George');
          return expect(p.get('firstName')).toEqual('George');
        });
      });
      describe('for a property using a custom getter', function() {
        return it('should invoke the given getter function', function() {
          var p;
          p = new Person;
          p.set('points', 18);
          expect(p._POINTS_).toEqual(18);
          return expect(p.get('points')).toEqual(18);
        });
      });
      it('should return all of the property values when given multiple property names', function() {
        var p;
        p = new Person;
        p.set({
          points: 18,
          firstName: 'Ed'
        });
        return expect(p.get('points', 'firstName')).toEqual({
          points: 18,
          firstName: 'Ed'
        });
      });
      it('should return all of the property values when given an array of property names', function() {
        var p;
        p = new Person;
        p.set({
          points: 19,
          firstName: 'Sue'
        });
        return expect(p.get(['points', 'firstName'])).toEqual({
          points: 19,
          firstName: 'Sue'
        });
      });
      return it('should invoke getUnknownProperty, passing the name if a property with the given name does not exist', function() {
        var p;
        p = new Person;
        spyOn(p, 'getUnknownProperty');
        p.get('doesntExist');
        return expect(p.getUnknownProperty).toHaveBeenCalledWith('doesntExist');
      });
    });
    describe('#getUnknownProperty', function() {
      return it('should throw and undefined key exception', function() {
        var o;
        o = new Z.Object;
        return expect(function() {
          return o.get('blah');
        }).toThrow("Z.Object#get: undefined key `blah` for " + (o.toString()));
      });
    });
    describe('#setUnknownProperty', function() {
      return it('should throw and undefined key exception', function() {
        var o;
        o = new Z.Object;
        return expect(function() {
          return o.set('blah', 1);
        }).toThrow("Z.Object#set: undefined key `blah` for " + (o.toString()));
      });
    });
    return describe('with a key path:', function() {
      var A, B, C, a, b, c;
      A = (function() {

        __extends(A, Z.Object);

        function A() {
          A.__super__.constructor.apply(this, arguments);
        }

        A.property('b');

        return A;

      })();
      B = (function() {

        __extends(B, Z.Object);

        function B() {
          B.__super__.constructor.apply(this, arguments);
        }

        B.property('c');

        return B;

      })();
      C = (function() {

        __extends(C, Z.Object);

        function C() {
          C.__super__.constructor.apply(this, arguments);
        }

        C.property('num');

        return C;

      })();
      a = b = c = null;
      beforeEach(function() {
        a = new A;
        b = new B;
        c = new C;
        a.b(b);
        return b.c(c);
      });
      describe('#set', function() {
        it('should set the value for the property identified by the given key path', function() {
          expect(c.num()).toBeUndefined();
          expect(c.get('num')).toBeUndefined();
          a.set('b.c.num', 9);
          expect(c.num()).toBe(9);
          return expect(c.get('num')).toBe(9);
        });
        return it('should do nothing when some segment in the path yields a null or undefined value', function() {
          a.b(null);
          expect(function() {
            return a.set('b.c.num', 9);
          }).not.toThrow();
          a.b(void 0);
          expect(function() {
            return a.set('b.c.num', 9);
          }).not.toThrow();
          expect(c.num()).toBeUndefined();
          return expect(c.get('num')).toBeUndefined();
        });
      });
      return describe('#get', function() {
        it('should return the value for the derived property identified by the given key path', function() {
          c.set('num', 21);
          return expect(a.get('b.c.num')).toBe(21);
        });
        return it('should return undefined when some segment in the path yields a null or undefined value', function() {
          b.c(null);
          expect(a.get('b.c.num')).toBeUndefined();
          b.c(void 0);
          return expect(a.get('b.c.num')).toBeUndefined();
        });
      });
    });
  });

}).call(this);
