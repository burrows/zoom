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
    Z.Object.addNamespace 'MyNamespace', MyNamespace
    expect(MyNamespace.Thing.className()).toBe 'MyNamespace.Thing'
    Z.Object.removeNamespace 'MyNamespace'

describe 'Z.Object.toString', ->
  it 'should return a string containing the class name and object id', ->
    o = new Z.Object
    expect(o.toString()).toEqual "#<Z.Object:#{o.objectId()}>"

describe 'Z.Object KVC support:', ->
  class Person extends Z.Object
    regularProp: 'x'
    firstName: (v) ->

  describe '#set', ->
    it 'should invoke the method with the given name if it exists to set the property value', ->
      p = new Person
      spyOn p, 'firstName'
      p.set 'firstName', 'Corey'
      expect(p.firstName).toHaveBeenCalledWith 'Corey'

    it 'should write directly to the property name if the property exists but is not a function', ->
      p = new Person
      p.set 'regularProp', 'y'
      expect(p.regularProp).toBe 'y'

    it 'should return null', ->
      p = new Person
      expect(p.set('firstName', 'Bob')).toBeNull()
      expect(p.set('regularProp', 'z')).toBeNull()

    it 'should invoke unknownProperty, passing the name and value if a property with the given name does not exist', ->
      p = new Person
      spyOn p, 'unknownProperty'
      p.set 'doesntExist', 1
      expect(p.unknownProperty).toHaveBeenCalledWith 'doesntExist', 1

  describe '#get', ->
    it 'should invoke the method with the given name if it exists to access the property', ->
      p = new Person
      spyOn p, 'firstName'
      p.get 'firstName'
      expect(p.firstName).toHaveBeenCalledWith()

    it 'should return the value of the given property name if it exists and is not a function', ->
      p = new Person
      expect(p.get 'regularProp').toBe 'x'

    it 'should invoke unknownProperty, passing the name if a property with the given name does not exist', ->
      p = new Person
      spyOn p, 'unknownProperty'
      p.get 'doesntExist'
      expect(p.unknownProperty).toHaveBeenCalledWith 'doesntExist'

  describe '#unknownProperty', ->
    it 'should throw and undefined key exception', ->
      o = new Z.Object
      expect(-> o.get('blah')).toThrow("Z.Object#get: undefined key `blah` for #{o.toString()}")
      expect(-> o.set('blah', 1)).toThrow("Z.Object#set: undefined key `blah` for #{o.toString()}")

