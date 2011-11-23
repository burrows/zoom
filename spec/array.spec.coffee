Z = this.Z || require 'zoom'

describe 'Z.Array', ->
  it 'should be defined', ->
    expect(Z.Array).toBeDefined()

describe 'Z.Array constructor', ->
  it 'should call super', ->
    a = new Z.Array
    expect(typeof a.objectId()).toEqual 'number'

  it 'should create an array of the given size when passed a single number', ->
    a = new Z.Array 3
    expect(a.length()).toBe 3
    expect(a.at(0)).toBeUndefined()
    expect(a.at(1)).toBeUndefined()
    expect(a.at(2)).toBeUndefined()

  it 'should create an array whose contents are the given values when anything other than a single number is passed', ->
    a1 = new Z.Array 1, 2
    a2 = new Z.Array 'a', 'b', 'c'
    expect(a1.length()).toBe 2
    expect(a1.at(0)).toBe 1
    expect(a1.at(1)).toBe 2
    expect(a2.length()).toBe 3
    expect(a2.at(0)).toEqual 'a'
    expect(a2.at(1)).toEqual 'b'
    expect(a2.at(2)).toEqual 'c'

  it 'should create an empty array when no arguments are given', ->
    a = new Z.Array
    expect(a.length()).toBe 0

describe 'Z.Array.fromNative', ->
  it 'should return a new Z.Array that contains the contents of the given native array', ->
    a = Z.Array.fromNative ['one', 2, 'three']
    expect(a instanceof Z.Array).toBe true
    expect(a.length()).toBe 3
    expect(a.at(0)).toEqual 'one'
    expect(a.at(1)).toEqual 2
    expect(a.at(2)).toEqual 'three'

describe 'Z.Array#toString', ->
  it 'should return a string with the class name, object id, and array contents', ->
    a = new Z.Array 1, 2, 3
    expect(a.toString()).toEqual "#<Z.Array:#{a.objectId()} [1, 2, 3]>"

describe 'Z.Array#toNative', ->
  it 'should return a native array with the contents of the Z.Array', ->
    za = Z.Array.fromNative(['x', 'y'])
    a  = za.toNative()
    expect(a instanceof Array).toBe true
    expect(a).toEqual ['x', 'y']

describe 'Z.Array#length', ->
  it 'should return the current length of the array', ->
    expect((new Z.Array 8).length()).toBe 8
    expect((new Z.Array 1,2,3).length()).toBe 3
    expect((new Z.Array [1,2,3]).length()).toBe 1
    expect(Z.Array.fromNative([1,2,3,4]).length()).toBe 4

  it 'should update when the array changes', ->
    a = new Z.Array 1,2,3
    expect(a.length()).toBe 3
    a.pop()
    expect(a.length()).toBe 2
    a.push(4)
    expect(a.length()).toBe 3

describe 'Z.Array#at', ->
  a = null

  beforeEach -> a = new Z.Array 'the', 'quick', 'brown', 'fox'

  it 'should return the value at the given index when given a positive index in range', ->
    expect(a.at(0)).toBe 'the'
    expect(a.at(1)).toBe 'quick'
    expect(a.at(2)).toBe 'brown'
    expect(a.at(3)).toBe 'fox'

  it 'should return the value at the index starting from the end when given a negative index in range', ->
    expect(a.at(-1)).toBe 'fox'
    expect(a.at(-2)).toBe 'brown'
    expect(a.at(-3)).toBe 'quick'
    expect(a.at(-4)).toBe 'the'

  it 'should return null when given a positive index that is out of range', ->
    expect(a.at(4)).toBeNull()
    expect(a.at(112)).toBeNull()

  it 'should return null when given a negative index that is out of range', ->
    expect(a.at(-5)).toBeNull()
    expect(a.at(-1743)).toBeNull()

describe 'Z.Array#splice', ->
  it 'should return the receiver', ->
    a = Z.A([1,2,3])
    expect(a.splice(0, 1, 100)).toBe a

  describe 'with 1 argument', ->
    it 'should remove all remaining items starting at the given index', ->
      expect(Z.A([0,1,2]).splice(0).toNative()).toEqual []
      expect(Z.A([0,1,2]).splice(1).toNative()).toEqual [0]
      expect(Z.A([0,1,2]).splice(2).toNative()).toEqual [0,1]
      expect(Z.A([0,1,2]).splice(3).toNative()).toEqual [0,1,2]

  describe 'with a positive index in range', ->
    it 'should replace the given number of items starting at the given index with the given objects', ->
      expect(Z.A([0,1,2]).splice(0, 0).toNative()).toEqual [0,1,2]
      expect(Z.A([0,1,2]).splice(0, 1).toNative()).toEqual [1,2]
      expect(Z.A([0,1,2]).splice(1, 1).toNative()).toEqual [0,2]
      expect(Z.A([0,1,2]).splice(1, 2).toNative()).toEqual [0]
      expect(Z.A([0,1,2]).splice(1, 20).toNative()).toEqual [0]
      expect(Z.A([0,1,2]).splice(0, 1, 100).toNative()).toEqual [100,1,2]
      expect(Z.A([0,1,2]).splice(1, 2, 'a', 'b').toNative()).toEqual [0,'a','b']
      expect(Z.A([0,1,2]).splice(1, 2, 'a', 'b', 'c', 'd').toNative()).toEqual [0,'a','b','c','d']

  describe 'with a positive index out of range', ->
    it 'should grow the length of the array', ->
      expect(Z.A([0,1,2]).splice(4, 0, 'x').toNative()).toEqual [0,1,2,undefined,'x']
      expect(Z.A([0,1,2]).splice(4, 0, 'x','y','z').toNative()).toEqual [0,1,2,undefined,'x','y','z']
      expect(Z.A([0,1,2]).splice(4, 2, 'x','y','z').toNative()).toEqual [0,1,2,undefined,'x','y','z']

  describe 'with a negative index in range', ->
    it 'should replace the given number of items starting at the index from the right with the given objects', ->
      expect(Z.A([0,1,2]).splice(-3, 0).toNative()).toEqual [0,1,2]
      expect(Z.A([0,1,2]).splice(-3, 1).toNative()).toEqual [1,2]
      expect(Z.A([0,1,2]).splice(-2, 1).toNative()).toEqual [0,2]
      expect(Z.A([0,1,2]).splice(-2, 2).toNative()).toEqual [0]
      expect(Z.A([0,1,2]).splice(-2, 20).toNative()).toEqual [0]
      expect(Z.A([0,1,2]).splice(-3, 1, 100).toNative()).toEqual [100,1,2]
      expect(Z.A([0,1,2]).splice(-2, 2, 'a', 'b').toNative()).toEqual [0,'a','b']
      expect(Z.A([0,1,2]).splice(-2, 2, 'a', 'b', 'c', 'd').toNative()).toEqual [0,'a','b','c','d']

  describe 'with a negative index out of range', ->
    it 'should throw an exception', ->
      a = Z.A([0,1,2])
      expect(-> a.splice(-12)).toThrow("Z.Array#splice: index `-12` is too small for #{a.toString()}")

describe 'Z.Array#isEqual', ->
  it 'should return true when the arrays are identical', ->
    a = new Z.Array
    expect(a.isEqual a).toBe true

  it 'should return true when the arrays have the same contents', ->
    a1 = new Z.Array 1, 2, 3
    a2 = new Z.Array 1, 2, 3
    expect(a1.isEqual a2).toBe true

  it 'should return false when given something other than an array', ->
    expect((new Z.Array).isEqual "foo").toBe false
    expect((new Z.Array).isEqual []).toBe false
    expect((new Z.Array).isEqual {}).toBe false
    expect((new Z.Array).isEqual new Z.Object).toBe false

  it 'should return false when the array contents differ', ->
    a1 = new Z.Array 1, 2, 3
    a2 = new Z.Array 1, 2, 4
    expect(a1.isEqual a2).toBe false

describe 'Z.Array#first', ->
  it 'should return the first object in the array', ->
    expect(Z.A([5,6,7]).first()).toBe 5

  it 'should return null when the array is empty', ->
    expect(Z.A([]).first()).toBe null

describe 'Z.Array#last', ->
  it 'should return the last object in the array', ->
    expect(Z.A([5,6,7]).last()).toBe 7

  it 'should return null when the array is empty', ->
    expect(Z.A([]).last()).toBe null

describe 'Z.Array#push', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  it 'should return the receiver', ->
    expect(a.push 4).toBe a

  it 'should append the given object(s) to the end of the array', ->
    a.push 4
    expect(a.toNative()).toEqual [1,2,3,4]
    a.push 10, 11, 12
    expect(a.toNative()).toEqual [1,2,3,4,10,11,12]

describe 'Z.Array#pop', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  it 'should return the last item in the array', ->
    expect(a.pop()).toBe 3

  it 'should return null when the array is empty', ->
    expect(Z.A([]).pop()).toBe null

  it 'should remove the last item from the array', ->
    a.pop()
    expect(a.toNative()).toEqual [1,2]
    a.pop()
    expect(a.toNative()).toEqual [1]
    a.pop()
    expect(a.toNative()).toEqual []
    a.pop()
    expect(a.toNative()).toEqual []

