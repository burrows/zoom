Z = this.Z || require 'zoom'

root = Z.root

describe 'Z.Object', ->
  it 'should be defined', -> expect(Z.Object).toBeDefined()

describe 'Z.Object constructor', ->
  it 'should assign an auto-incrementing id to each new instance, accessible via the objectId property', ->
    o1 = new Z.Object; o2 = new Z.Object; o3 = new Z.Object
    expect(typeof o1.objectId()).toBe 'number'
    expect(typeof o2.get 'objectId').toBe 'number'
    expect(typeof o3.objectId()).toBe 'number'
    expect(o1.objectId() < o2.objectId()).toBe true
    expect(o2.get('objectId') < o3.get('objectId')).toBe true

  it 'should set all given properties when passed a native object', ->
    class Foo extends Z.Object
      @property 'a'
      @property 'b'

    f = new Foo
    expect(f.a()).toBeUndefined()
    expect(f.b()).toBeUndefined()

    f = new Foo a: 1
    expect(f.a()).toBe 1
    expect(f.b()).toBeUndefined()

    f = new Foo a: 1, b: 2
    expect(f.a()).toBe 1
    expect(f.b()).toBe 2

describe 'Z.Object.className', ->
  beforeEach ->
    class Z.Stuff extends Z.Object
    root.MyNamespace = {}
    class MyNamespace.Thing extends Z.Object

  afterEach ->
    delete Z.Stuff
    delete root.MyNamespace

  it 'should return the name of the class for classes in the Z namespace', ->
    expect(Z.Object.className()).toBe 'Z.Object'
    expect(Z.Stuff.className()).toBe 'Z.Stuff'

  it 'should return the name of the class for classes in the global namespace', ->
    class root.Global extends Z.Object
    expect(Global.className()).toBe 'Global'
    delete root.Global

  it 'should return "(Unknown)" for classes not defined in a namespace', ->
    class SomeClass extends Z.Object
    expect(SomeClass.className()).toBe '(Unknown)'

  it 'should return "(Unknown)" for classes defined in a namespace other than Z but not registered', ->
    expect(MyNamespace.Thing.className()).toBe '(Unknown)'

  it 'should return the name of the class for classes defined in a namespace other than Z that is registered', ->
    Z.Object.addNamespace MyNamespace, 'MyNamespace'
    expect(MyNamespace.Thing.className()).toBe 'MyNamespace.Thing'
    Z.Object.removeNamespace MyNamespace

describe 'Z.Object.toString', ->
  it 'should return a string containing the class name, object id and current property values', ->
    class root.Foo extends Z.Object
      @property 'a'
      @property 'b'

    o = new Z.Object; f = new Foo a: 9, b: 'xyz'

    expect(o.toString()).toEqual "#<Z.Object:#{o.objectId()}>"
    expect(f.toString()).toEqual "#<Foo:#{f.objectId()} @a=9, @b=xyz>"

describe 'Z.Object.eq', ->
  it 'should return true if the objects are identical', ->
    o = new Z.Object
    expect(o.eq o).toBe true

  it 'should return false if the objects are not identical', ->
    o1 = new Z.Object; o2 = new Z.Object
    expect(o1.eq o2).toBe false
    expect(o1.eq 8).toBe false
    expect(o1.eq {}).toBe false
    expect(o1.eq []).toBe false

describe 'Z.Object.property', ->
  class Person extends Z.Object
    @property 'firstName'

  it 'should define an instance method with the given name', ->
    p = new Person
    expect(typeof p.firstName).toEqual 'function'

  describe 'generated instance method', ->
    it 'should set a private property when passed an argument', ->
      p = new Person
      expect(p.__firstName__).toBeUndefined()
      p.firstName 'Corey'
      expect(p.__firstName__).toEqual 'Corey'

    it 'should return the private property value when passed no arguments', ->
      p = new Person
      expect(p.firstName()).toBeUndefined()
      p.firstName 'Nicole'
      expect(p.firstName()).toEqual 'Nicole'

describe 'Z.Object.hasProperty', ->
  class A extends Z.Object
    @property 'foo'

  class B extends A
    @property 'bar'

  it 'should return true if a property with the given name exists on the class', ->
    expect(A.hasProperty('foo')).toBe true
    expect(B.hasProperty('bar')).toBe true

  it 'should return true if a property with the given name exists on a superclass', ->
    expect(B.hasProperty('foo')).toBe true

  it 'should return false if a property with the given does not exist on the class', ->
    expect(A.hasProperty('idontexist')).toBe false
    expect(A.hasProperty('bar')).toBe false

describe 'Z.Object KVC support:', ->
  class Person extends Z.Object
    @property 'firstName'
    @property 'points',
      get: -> @_POINTS_
      set: (v) -> @_POINTS_ = v

  describe '#set when given a key', ->
    describe 'for a property using the default setter', ->
      it 'should set a private property name on the receiver', ->
        p = new Person
        expect(p.__firstName__).toBeUndefined()
        p.set 'firstName', 'Nicole'
        expect(p.__firstName__).toEqual 'Nicole'

    describe 'for a property using a custom setter', ->
      it 'should invoke the given setter function', ->
        p = new Person
        expect(p._POINTS_).toBeUndefined()
        expect(p.__points__).toBeUndefined()
        p.set 'points', 18
        expect(p._POINTS_).toEqual 18
        expect(p.__points__).toBeUndefined()

    it 'should return null', ->
      p = new Person
      expect(p.set('firstName', 'Bob')).toBeNull()
      expect(p.set('points', 9)).toBeNull()

    it 'should set all of the properties when given a hash', ->
      p = new Person
      p.set firstName: 'Joe', points: 12
      expect(p.get 'firstName').toBe 'Joe'
      expect(p.get 'points').toBe 12

    it 'should invoke setUnknownProperty, passing the name and value if a property with the given name does not exist', ->
      p = new Person
      spyOn p, 'setUnknownProperty'
      p.set 'doesntExist', 1
      expect(p.setUnknownProperty).toHaveBeenCalledWith 'doesntExist', 1

  describe '#get when given a key', ->
    describe 'for a property using the default getter', ->
      it 'should get a private property name on the receiver', ->
        p = new Person
        p.set 'firstName', 'George'
        expect(p.__firstName__).toEqual 'George'
        expect(p.get 'firstName').toEqual 'George'

    describe 'for a property using a custom getter', ->
      it 'should invoke the given getter function', ->
        p = new Person
        p.set 'points', 18
        expect(p._POINTS_).toEqual 18
        expect(p.get 'points').toEqual 18

    it 'should return all of the property values when given multiple property names', ->
      p = new Person
      p.set points: 18, firstName: 'Ed'
      expect(p.get('points', 'firstName')).toEqual { points: 18, firstName: 'Ed' }

    it 'should return all of the property values when given an array of property names', ->
      p = new Person
      p.set points: 19, firstName: 'Sue'
      expect(p.get(['points', 'firstName'])).toEqual({ points: 19, firstName: 'Sue' })

    it 'should return all of the property values when given a Z.Array of property names', ->
      p = new Person
      p.set points: 19, firstName: 'Sue'
      expect(p.get(Z.A ['points', 'firstName'])).toEqual({ points: 19, firstName: 'Sue' })

    it 'should invoke getUnknownProperty, passing the name if a property with the given name does not exist', ->
      p = new Person
      spyOn p, 'getUnknownProperty'
      p.get 'doesntExist'
      expect(p.getUnknownProperty).toHaveBeenCalledWith 'doesntExist'

  describe '#getUnknownProperty', ->
    it 'should throw and undefined key exception', ->
      o = new Z.Object
      expect(-> o.get('blah')).toThrow("Z.Object#get: undefined key `blah` for #{o.toString()}")

  describe '#setUnknownProperty', ->
    it 'should throw and undefined key exception', ->
      o = new Z.Object
      expect(-> o.set('blah', 1)).toThrow("Z.Object#set: undefined key `blah` for #{o.toString()}")

  describe 'with a key path:', ->
    class A extends Z.Object
      @property 'b'
    class B extends Z.Object
      @property 'c'
    class C extends Z.Object
      @property 'num'

    a = b = c = null

    beforeEach ->
      a = new A; b = new B; c = new C
      a.b b
      b.c c

    describe '#set', ->
      it 'should set the value for the property identified by the given key path', ->
        expect(c.num()).toBeUndefined()
        expect(c.get 'num').toBeUndefined()

        a.set 'b.c.num', 9

        expect(c.num()).toBe 9
        expect(c.get 'num').toBe 9

      it 'should do nothing when some segment in the path yields a null or undefined value', ->
        a.b null
        expect(-> a.set 'b.c.num', 9).not.toThrow()

        a.b undefined
        expect(-> a.set 'b.c.num', 9).not.toThrow()

        expect(c.num()).toBeUndefined()
        expect(c.get 'num').toBeUndefined()

    describe '#get', ->
      it 'should return the value for the derived property identified by the given key path', ->
        c.set 'num', 21
        expect(a.get 'b.c.num').toBe 21

      it 'should return undefined when some segment in the path yields a null or undefined value', ->
        b.c null
        expect(a.get 'b.c.num').toBeUndefined()
        b.c undefined
        expect(a.get 'b.c.num').toBeUndefined()

describe 'Z.Object KVO support:', ->
  class User extends Z.Object
    @property 'name'

  user = null

  beforeEach -> user = new User name: 'Joe'

  describe '#observe with a simple key', ->
    it 'should cause the given action to be invoked, bound to the observer, after the given key has changed', ->
      observer = { called: false, nameDidChange: () -> @called = true }
      user.observe 'name', observer, 'nameDidChange'
      user.set 'name', 'Bob'
      expect(observer.called).toBe true

    it 'should cause the given function to be invoked, bound to the observer, when the given key has changed', ->
      observer = { called: false, nameDidChange: () -> @called = true }
      user.observe 'name', observer, observer.nameDidChange
      user.set 'name', 'Bob'
      expect(observer.called).toBe true

    it 'should cause the given action to be invoked with a change notification object containing the key that changed and the observee when the given key has changed', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange'
      user.set 'name', 'Bob'
      expect(observer.notification.key).toEqual 'name'
      expect(observer.notification.observee).toBe user

    it 'should allow attaching multiple observers to the same key', ->
      observer1 = { called: false, action: () -> @called = true }
      observer2 = { called: false, action: () -> @called = true }
      user.observe 'name', observer1, 'action'
      user.observe 'name', observer2, 'action'
      user.name 'Sam'
      expect(observer1.called).toBe true
      expect(observer2.called).toBe true

  # TODO: stopObserving
  # TODO: pass context object to observer

describe 'Z.Object.mixin', ->
  MyMixin = new Z.Mixin ->
    @property 'a'
    @property 'b', get: -> 'prop b'

    @class
      foo: 1
      bar: () -> 'class bar'

    @instance
      foo: 2
      bar: () -> 'instance bar'

  class MyClass extends Z.Object
    @mixin MyMixin
    @property 'c'

  it 'should define all of the properties from the mixin on the receiver class', ->
    expect(MyClass.hasProperty 'a').toBe true
    expect(MyClass.hasProperty 'b').toBe true
    expect(MyClass.hasProperty 'c').toBe true
    expect((new MyClass).get('b')).toEqual 'prop b'

  it 'should define all of the class properties from the mixin on the receiver class', ->
    expect(MyClass.foo).toBe 1
    expect(MyClass.bar()).toEqual 'class bar'

  it 'should define all of the instance properties from the mixin on the receiver class', ->
    expect((new MyClass).foo).toBe 2
    expect((new MyClass).bar()).toEqual 'instance bar'

