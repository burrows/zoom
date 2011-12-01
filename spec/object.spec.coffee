Z = this.Z || require 'zoom'

root = Z.root

describe 'Z.Object', ->
  it 'should be defined', -> expect(Z.Object).toBeDefined()

describe 'Z.Object constructor', ->
  it 'should assign an auto-incrementing id to each new instance', ->
    o1 = new Z.Object; o2 = new Z.Object; o3 = new Z.Object
    expect(typeof o1.objectId()).toBe 'number'
    expect(typeof o2.objectId()).toBe 'number'
    expect(typeof o3.objectId()).toBe 'number'
    expect(o1.objectId() < o2.objectId()).toBe true
    expect(o2.objectId() < o3.objectId()).toBe true

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
  it 'should return a string containing the class name and object id', ->
    o = new Z.Object
    expect(o.toString()).toEqual "#<Z.Object:#{o.objectId()}>"

describe 'Z.Object.isEqual', ->
  it 'should return true if the objects are identical', ->
    o = new Z.Object
    expect(o.isEqual o).toBe true

  it 'should return false if the objects are not identical', ->
    o1 = new Z.Object; o2 = new Z.Object
    expect(o1.isEqual o2).toBe false
    expect(o1.isEqual 8).toBe false
    expect(o1.isEqual {}).toBe false
    expect(o1.isEqual []).toBe false

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

  describe '#set', ->
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

  describe '#get', ->
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

