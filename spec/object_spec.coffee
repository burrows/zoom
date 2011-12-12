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
    @property 'address'

  class Address extends Z.Object
    @property 'street'

  user = null

  describe '#observe with a simple key', ->
    beforeEach -> user = new User name: 'Joe'

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

    it 'should cause the given action to be invoked with a change notification object containing the path that changed and the observee when the given key has changed', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange'
      user.set 'name', 'Bob'
      expect(observer.notification.path).toEqual 'name'
      expect(observer.notification.observee).toBe user

    it 'should allow attaching multiple observers to the same key', ->
      observer1 = { called: false, action: () -> @called = true }
      observer2 = { called: false, action: () -> @called = true }
      user.observe 'name', observer1, 'action'
      user.observe 'name', observer2, 'action'
      user.name 'Sam'
      expect(observer1.called).toBe true
      expect(observer2.called).toBe true

    it 'should pass the object indicated by the context option in the notification if it exists', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', context: 'the-context'
      user.set 'name', 'Bob'
      expect(observer.notification.context).toEqual 'the-context'

    it 'should set an `old` key in the notification that points to the previous value of the property if the old option is set', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', old: true
      user.set 'name', 'Sam'
      expect(observer.notification.old).toEqual 'Joe'

    it 'should set a `new` key in the notification that points to the new value of the property if the new option is set', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', new: true
      user.set 'name', 'George'
      expect(observer.notification.new).toEqual 'George'

    it 'should set both `old` and `new` keys when both options are set', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', old: true, new: true
      user.set 'name', 'Ed'
      expect(observer.notification.old).toEqual 'Joe'
      expect(observer.notification.new).toEqual 'Ed'

    it 'should fire the observer immediately when  the `fire` option is set', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', fire: true
      expect(observer.notification).not.toBeNull()
      expect(observer.notification.path).toEqual 'name'
      expect(observer.notification.observee).toBe user

    it 'should fire the observer immediately when the `fire` option is set and include the `new` key when the `new` option is set', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', fire: true, new: true
      expect(observer.notification.path).toEqual 'name'
      expect(observer.notification.new).toEqual 'Joe'

    it 'should fire the observer immediately when the `fire` option is set and not include the `old` key even when the `old` option is set', ->
      observer = { notification: null, nameDidChange: (n) -> @notification = n }
      user.observe 'name', observer, 'nameDidChange', fire: true, old: true
      expect(observer.notification.hasOwnProperty 'old').toBe false

    it 'should invoke the callback before the property change actually occurs when the `prior` option is set', ->
      observer =
        notifications: []
        nameDidChange: (n) -> n.currentVal = user.name(); @notifications.push n

      user.observe 'name', observer, 'nameDidChange', prior: true
      user.set 'name', 'Corey'
      expect(observer.notifications.length).toBe 2
      expect(observer.notifications[0].currentVal).toEqual 'Joe'
      expect(observer.notifications[0].isPrior).toBe true
      expect(observer.notifications[1].currentVal).toEqual 'Corey'
      expect(observer.notifications[1].isPrior).toBeUndefined()

    it 'should include the `old` key in the notification when notifying prior to a property change when the `old` option is set', ->
      observer =
        notifications: []
        nameDidChange: (n) -> @notifications.push n

      user.observe 'name', observer, 'nameDidChange', prior: true, old: true
      user.set 'name', 'Corey'
      expect(observer.notifications.length).toBe 2
      expect(observer.notifications[0].old).toEqual 'Joe'
      expect(observer.notifications[1].old).toEqual 'Joe'

    it 'should not include the `new` key in the notification when notifying prior to a property change when the `new` option is set', ->
      observer =
        notifications: []
        nameDidChange: (n) -> @notifications.push n

      user.observe 'name', observer, 'nameDidChange', prior: true, new: true
      user.set 'name', 'Corey'
      expect(observer.notifications.length).toBe 2
      expect(observer.notifications[0].hasOwnProperty 'new').toBe false
      expect(observer.notifications[1].new).toEqual 'Corey'

  describe '#stopObserving with a simple key', ->
    it 'should prevent the registered observer from being notified of further changes', ->
      user = new User name: 'Joe'
      observer1 = { called: false, action: () -> @called = true }
      observer2 = { called: false, action: () -> @called = true }
      user.observe 'name', observer1, 'action'
      user.observe 'name', observer2, 'action'
      user.name 'Mary'
      expect(observer1.called).toBe true
      expect(observer2.called).toBe true
      observer1.called = false
      observer2.called = false
      user.stopObserving 'name', observer1, 'action'
      user.name 'Susan'
      expect(observer1.called).toBe false
      expect(observer2.called).toBe true

  describe '#observe with a key path', ->
    it 'should cause a notification to be delivered to the observer when the key at the end of the path changes', ->
      observer = { called: false, action: () -> @called = true }
      user     = new User(address: new Address(street: 'main'))

      user.observe('address.street', observer, 'action')
      expect(observer.called).toBe false
      user.get('address').set('street', 'north')
      expect(observer.called).toBe true

    it 'should still cause a notification to be delivered even when some segments in the path do not yet exist when the observer is created', ->
      observer = { called: 0, action: () -> @called++ }
      user     = new User

      user.observe('address.street', observer, 'action')
      expect(observer.called).toBe 0
      user.set 'address', new Address
      expect(observer.called).toBe 1
      user.get('address').set('street', 'pine')
      expect(observer.called).toBe 2

    it 'should cause a notification to be sent when the property is initially set via a constructor', ->
      observer = { called: false, action: () -> @called = true }
      user     = new User

      user.observe('address.street', observer, 'action')
      expect(observer.called).toBe false
      user.set 'address', new Address(street: 'chestnut')
      expect(observer.called).toBe true

  describe '#stopObserving with a key path', ->

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

