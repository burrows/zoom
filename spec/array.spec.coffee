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

describe 'Z.Array#toString', ->
  it 'should return a string with the class name, object id, and array contents', ->
    a = new Z.Array 1, 2, 3
    expect(a.toString()).toEqual "#<Z.Array:#{a.objectId()} [1, 2, 3]>"

describe 'Z.Array#toNative', ->
  it 'should return a native array with the contents of the Z.Array', ->
    za = Z.A(['x', 'y'])
    a  = za.toNative()
    expect(a instanceof Array).toBe true
    expect(a).toEqual ['x', 'y']

describe 'Z.Array#length (property)', ->
  it 'should return the current length of the array', ->
    expect((new Z.Array 8).length()).toBe 8
    expect((new Z.Array 1,2,3).get('length')).toBe 3
    expect(Z.A([1,2,3,4]).length()).toBe 4

  it 'should update when the array changes', ->
    a = new Z.Array 1,2,3
    expect(a.length()).toBe 3
    a.pop()
    expect(a.length()).toBe 2
    a.push(4)
    expect(a.length()).toBe 3

  it 'should update the length of the array when set', ->
    a = new Z.Array
    expect(a.get('length')).toBe 0
    a.length 9
    expect(a.get('length')).toBe 9
    expect(a.toNative().length).toBe 9
    a.set 'length', 5
    expect(a.get('length')).toBe 5
    expect(a.toNative().length).toBe 5

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

describe 'Z.Array#slice', ->
  a = null
  beforeEach -> a = new Z.Array 0,1,2,3,4,5

  describe 'given just an index', ->
    it 'should return a new Z.Array with only the items at the given index and after', ->
      expect(a.slice(0).toNative()).toEqual [0,1,2,3,4,5]
      expect(a.slice(1).toNative()).toEqual [1,2,3,4,5]
      expect(a.slice(2).toNative()).toEqual [2,3,4,5]
      expect(a.slice(-1).toNative()).toEqual [5]
      expect(a.slice(-2).toNative()).toEqual [4,5]
      expect(a.slice(-3).toNative()).toEqual [3,4,5]

    it 'should return null when given an out of bounds index', ->
      expect(a.slice(20)).toEqual null
      expect(a.slice(-20)).toEqual null

  describe 'given an index and a length', ->
    it 'should return a new Z.Array containing the item at the given index and continuing for n items', ->
      expect(a.slice(0, 0).toNative()).toEqual []
      expect(a.slice(0, 1).toNative()).toEqual [0]
      expect(a.slice(0, 3).toNative()).toEqual [0,1,2]
      expect(a.slice(2, 2).toNative()).toEqual [2,3]
      expect(a.slice(2, 4).toNative()).toEqual [2,3,4,5]
      expect(a.slice(2, 8).toNative()).toEqual [2,3,4,5]
      expect(a.slice(-6, 0).toNative()).toEqual []
      expect(a.slice(-6, 1).toNative()).toEqual [0]
      expect(a.slice(-6, 3).toNative()).toEqual [0,1,2]
      expect(a.slice(-4, 2).toNative()).toEqual [2,3]
      expect(a.slice(-4, 4).toNative()).toEqual [2,3,4,5]
      expect(a.slice(-4, 8).toNative()).toEqual [2,3,4,5]

    it 'should return null when given an out of bounds index', ->
      expect(a.slice(20, 2)).toBeNull()
      expect(a.slice(-20, 2)).toBeNull()

describe 'Z.Array#slice$', ->
  it 'should return null and not mutate the receiver if the given index is out of bounds', ->
    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(20)).toBeNull()
    expect(a.toNative()).toEqual [0,1,2,3,4,5]
    expect(a.slice$(-20)).toBeNull()
    expect(a.toNative()).toEqual [0,1,2,3,4,5]

  it 'should return the same thing as slice, but mutate the receiver in the process', ->
    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(0).toNative()).toEqual [0,1,2,3,4,5]
    expect(a.toNative()).toEqual []

    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(4).toNative()).toEqual [4,5]
    expect(a.toNative()).toEqual [0,1,2,3]

    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(2,2).toNative()).toEqual [2,3]
    expect(a.toNative()).toEqual [0,1,4,5]

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

describe 'Z.Array.unshift', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  it 'should return the receiver', ->
    expect(a.unshift 4).toBe a

  it 'should prepend the given object(s) to the beginning of the array', ->
    a.unshift 4
    expect(a.toNative()).toEqual [4,1,2,3]
    a.unshift 10, 11, 12
    expect(a.toNative()).toEqual [10,11,12,4,1,2,3]

describe 'Z.Array#pop', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  describe 'with no arguments', ->
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

  describe 'with an integer argument', ->
    it 'should return the last n items in a Z.Array', ->
      expect(Z.A([1,2,3]).pop(0).toNative()).toEqual []
      expect(Z.A([1,2,3]).pop(1).toNative()).toEqual [3]
      expect(Z.A([1,2,3]).pop(2).toNative()).toEqual [2,3]
      expect(Z.A([1,2,3]).pop(3).toNative()).toEqual [1,2,3]
      expect(Z.A([1,2,3]).pop(4).toNative()).toEqual [1,2,3]

    it 'should remove the last n items from the array', ->
      a = new Z.Array 1,2,3,4,5,6,7

      a.pop 0
      expect(a.toNative()).toEqual([1,2,3,4,5,6,7])
      a.pop 1
      expect(a.toNative()).toEqual([1,2,3,4,5,6])
      a.pop 2
      expect(a.toNative()).toEqual([1,2,3,4])
      a.pop 5
      expect(a.toNative()).toEqual([])

    it 'should throw an exception if given a negative number', ->
      a = new Z.Array
      expect(-> a.pop(-1)).toThrow("Z.Array#pop: array size must be positive")

describe 'Z.Array#shift', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  describe 'with no arguments', ->
    it 'should return the first item in the array', ->
      expect(a.shift()).toBe 1

    it 'should return null when the array is empty', ->
      expect(Z.A([]).shift()).toBe null

    it 'should remove the first item from the array', ->
      a.shift()
      expect(a.toNative()).toEqual [2,3]
      a.shift()
      expect(a.toNative()).toEqual [3]
      a.shift()
      expect(a.toNative()).toEqual []
      a.shift()
      expect(a.toNative()).toEqual []

  describe 'with an integer arugment', ->
    it 'should return the first n items in a Z.Array', ->
      expect(Z.A([1,2,3]).shift(0).toNative()).toEqual []
      expect(Z.A([1,2,3]).shift(1).toNative()).toEqual [1]
      expect(Z.A([1,2,3]).shift(2).toNative()).toEqual [1,2]
      expect(Z.A([1,2,3]).shift(3).toNative()).toEqual [1,2,3]
      expect(Z.A([1,2,3]).shift(4).toNative()).toEqual [1,2,3]

    it 'should remove the first n items from the array', ->
      a = new Z.Array 1,2,3,4,5,6,7

      a.shift 0
      expect(a.toNative()).toEqual([1,2,3,4,5,6,7])
      a.shift 1
      expect(a.toNative()).toEqual([2,3,4,5,6,7])
      a.shift 2
      expect(a.toNative()).toEqual([4,5,6,7])
      a.shift 5
      expect(a.toNative()).toEqual([])

    it 'should throw an exception if given a negative number', ->
      a = new Z.Array
      expect(-> a.shift(-1)).toThrow("Z.Array#shift: array size must be positive")

