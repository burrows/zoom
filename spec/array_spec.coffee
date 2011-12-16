require './helper' unless Z?

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

  it 'should notify observers when the length changes', ->
    observer = { notifications: [], action: (n) -> @notifications.push n }
    a        = Z.A [1,2,3,4,5]

    a.observe 'length', observer, 'action', old: true, new: true

    a.push 6
    expect(observer.notifications.length).toBe 1
    expect(observer.notifications[0].old).toBe 5
    expect(observer.notifications[0].new).toBe 6
    a.unshift 0
    expect(observer.notifications.length).toBe 2
    expect(observer.notifications[1].old).toBe 6
    expect(observer.notifications[1].new).toBe 7
    a.pop()
    expect(observer.notifications.length).toBe 3
    expect(observer.notifications[2].old).toBe 7
    expect(observer.notifications[2].new).toBe 6
    a.at 0, 10
    expect(observer.notifications.length).toBe 3
    a.at 20, 20
    expect(observer.notifications.length).toBe 4
    expect(observer.notifications[3].old).toBe 6
    expect(observer.notifications[3].new).toBe 21

describe 'Z.Array#at', ->
  a = null

  beforeEach -> a = new Z.Array 'the', 'quick', 'brown', 'fox'

  describe 'given just an index', ->
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

  describe 'given an index and a value', ->
    it 'should set the value at the given index', ->
      expect(a.at 0).toBe 'the'
      a.at 0, 'THE'
      expect(a.at 0).toBe 'THE'

      expect(a.at -1).toBe 'fox'
      a.at -1, 'dog'
      expect(a.at -1).toBe 'dog'

    it 'should return the value', ->
      expect(a.at 1, 'slow').toBe 'slow'

describe 'Z.Array#splice', ->
  it 'should return the receiver', ->
    a = Z.A([1,2,3])
    expect(a.splice(0, 1, 100)).toBe a

  describe 'with 1 argument', ->
    it 'should remove all remaining items starting at the given index', ->
      expect(Z.A([0,1,2]).splice(0)).toEq Z.A()
      expect(Z.A([0,1,2]).splice(1)).toEq Z.A([0])
      expect(Z.A([0,1,2]).splice(2)).toEq Z.A([0,1])
      expect(Z.A([0,1,2]).splice(3)).toEq Z.A([0,1,2])

  describe 'with a positive index in range', ->
    it 'should replace the given number of items starting at the given index with the given objects', ->
      expect(Z.A([0,1,2]).splice(0, 0)).toEq Z.A([0,1,2])
      expect(Z.A([0,1,2]).splice(0, 1)).toEq Z.A([1,2])
      expect(Z.A([0,1,2]).splice(1, 1)).toEq Z.A([0,2])
      expect(Z.A([0,1,2]).splice(1, 2)).toEq Z.A([0])
      expect(Z.A([0,1,2]).splice(1, 20)).toEq Z.A([0])
      expect(Z.A([0,1,2]).splice(0, 1, 100)).toEq Z.A([100,1,2])
      expect(Z.A([0,1,2]).splice(1, 2, 'a', 'b')).toEq Z.A([0,'a','b'])
      expect(Z.A([0,1,2]).splice(1, 2, 'a', 'b', 'c', 'd')).toEq Z.A([0,'a','b','c','d'])

  describe 'with a positive index out of range', ->
    it 'should grow the length of the array', ->
      expect(Z.A([0,1,2]).splice(4, 0, 'x')).toEq Z.A([0,1,2,undefined,'x'])
      expect(Z.A([0,1,2]).splice(4, 0, 'x','y','z')).toEq Z.A([0,1,2,undefined,'x','y','z'])
      expect(Z.A([0,1,2]).splice(4, 2, 'x','y','z')).toEq Z.A([0,1,2,undefined,'x','y','z'])

  describe 'with a negative index in range', ->
    it 'should replace the given number of items starting at the index from the right with the given objects', ->
      expect(Z.A([0,1,2]).splice(-3, 0)).toEq Z.A [0,1,2]
      expect(Z.A([0,1,2]).splice(-3, 1)).toEq Z.A [1,2]
      expect(Z.A([0,1,2]).splice(-2, 1)).toEq Z.A [0,2]
      expect(Z.A([0,1,2]).splice(-2, 2)).toEq Z.A [0]
      expect(Z.A([0,1,2]).splice(-2, 20)).toEq Z.A [0]
      expect(Z.A([0,1,2]).splice(-3, 1, 100)).toEq Z.A [100,1,2]
      expect(Z.A([0,1,2]).splice(-2, 2, 'a', 'b')).toEq Z.A [0,'a','b']
      expect(Z.A([0,1,2]).splice(-2, 2, 'a', 'b', 'c', 'd')).toEq Z.A [0,'a','b','c','d']

  describe 'with a negative index out of range', ->
    it 'should throw an exception', ->
      a = Z.A([0,1,2])
      expect(-> a.splice(-12)).toThrow("Z.Array#splice: index `-12` is too small for #{a.toString()}")

describe 'Z.Array#slice', ->
  a = null
  beforeEach -> a = new Z.Array 0,1,2,3,4,5

  describe 'given just an index', ->
    it 'should return a new Z.Array with only the items at the given index and after', ->
      expect(a.slice(0)).toEq Z.A [0,1,2,3,4,5]
      expect(a.slice(1)).toEq Z.A [1,2,3,4,5]
      expect(a.slice(2)).toEq Z.A [2,3,4,5]
      expect(a.slice(-1)).toEq Z.A [5]
      expect(a.slice(-2)).toEq Z.A [4,5]
      expect(a.slice(-3)).toEq Z.A [3,4,5]

    it 'should return null when given an out of bounds index', ->
      expect(a.slice(20)).toBe null
      expect(a.slice(-20)).toBe null

  describe 'given an index and a length', ->
    it 'should return a new Z.Array containing the item at the given index and continuing for n items', ->
      expect(a.slice(0, 0)).toEq Z.A []
      expect(a.slice(0, 1)).toEq Z.A [0]
      expect(a.slice(0, 3)).toEq Z.A [0,1,2]
      expect(a.slice(2, 2)).toEq Z.A [2,3]
      expect(a.slice(2, 4)).toEq Z.A [2,3,4,5]
      expect(a.slice(2, 8)).toEq Z.A [2,3,4,5]
      expect(a.slice(-6, 0)).toEq Z.A []
      expect(a.slice(-6, 1)).toEq Z.A [0]
      expect(a.slice(-6, 3)).toEq Z.A [0,1,2]
      expect(a.slice(-4, 2)).toEq Z.A [2,3]
      expect(a.slice(-4, 4)).toEq Z.A [2,3,4,5]
      expect(a.slice(-4, 8)).toEq Z.A [2,3,4,5]

    it 'should return null when given an out of bounds index', ->
      expect(a.slice(20, 2)).toBeNull()
      expect(a.slice(-20, 2)).toBeNull()

describe 'Z.Array#slice$', ->
  it 'should return null and not mutate the receiver if the given index is out of bounds', ->
    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(20)).toBeNull()
    expect(a).toEq Z.A [0,1,2,3,4,5]
    expect(a.slice$(-20)).toBeNull()
    expect(a).toEq Z.A [0,1,2,3,4,5]

  it 'should return the same thing as slice, but mutate the receiver in the process', ->
    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(0)).toEq Z.A [0,1,2,3,4,5]
    expect(a).toEq Z.A []

    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(4)).toEq Z.A [4,5]
    expect(a).toEq Z.A [0,1,2,3]

    a = new Z.Array 0,1,2,3,4,5
    expect(a.slice$(2,2)).toEq Z.A [2,3]
    expect(a).toEq Z.A [0,1,4,5]

describe 'Z.Array#eq', ->
  it 'should return true when the arrays are identical', ->
    a = new Z.Array
    expect(a.eq a).toBe true

  it 'should return true when the arrays have the same contents', ->
    a1 = new Z.Array 1, 2, 3
    a2 = new Z.Array 1, 2, 3
    expect(a1.eq a2).toBe true

  it 'should return false when given something other than an array', ->
    expect((new Z.Array).eq "foo").toBe false
    expect((new Z.Array).eq []).toBe false
    expect((new Z.Array).eq {}).toBe false
    expect((new Z.Array).eq new Z.Object).toBe false

  it 'should return false when the array contents differ', ->
    a1 = new Z.Array 1, 2, 3
    a2 = new Z.Array 1, 2, 4
    expect(a1.eq a2).toBe false

describe 'Z.Array#first (property)', ->
  it 'should return the first object in the array', ->
    expect(Z.A([5,6,7]).first()).toBe 5

  it 'should return null when the array is empty', ->
    expect(Z.A([]).first()).toBe null

  it 'should notify observers when changed', ->
    observer = { notifications: [], action: (n) -> @notifications.push n }
    a        = Z.A 1,2,3

    a.observe('first', observer, 'action', old: true, new: true)
    a.at 0, 10
    expect(observer.notifications.length).toBe 1
    expect(observer.notifications[0].old).toBe 1
    expect(observer.notifications[0].new).toBe 10
    a.shift()
    expect(observer.notifications.length).toBe 2
    expect(observer.notifications[1].old).toBe 10
    expect(observer.notifications[1].new).toBe 2
    a.unshift(9)
    expect(observer.notifications.length).toBe 3
    expect(observer.notifications[2].old).toBe 2
    expect(observer.notifications[2].new).toBe 9
    a.splice 0
    expect(observer.notifications.length).toBe 4
    expect(observer.notifications[3].old).toBe 9
    expect(observer.notifications[3].new).toBeNull()

describe 'Z.Array#last (property)', ->
  it 'should return the last object in the array', ->
    expect(Z.A([5,6,7]).last()).toBe 7

  it 'should return null when the array is empty', ->
    expect(Z.A([]).last()).toBe null

  it 'should notify observers when changed', ->
    observer = { notifications: [], action: (n) -> @notifications.push n }
    a        = Z.A 1,2,3

    a.observe('last', observer, 'action', old: true, new: true)
    a.at 2, 30
    expect(observer.notifications.length).toBe 1
    expect(observer.notifications[0].old).toBe 3
    expect(observer.notifications[0].new).toBe 30
    a.pop()
    expect(observer.notifications.length).toBe 2
    expect(observer.notifications[1].old).toBe 30
    expect(observer.notifications[1].new).toBe 2
    a.push(9)
    expect(observer.notifications.length).toBe 3
    expect(observer.notifications[2].old).toBe 2
    expect(observer.notifications[2].new).toBe 9
    a.splice 1, 4, 100, 200, 300, 400
    expect(observer.notifications.length).toBe 4
    expect(observer.notifications[3].old).toBe 9
    expect(observer.notifications[3].new).toBe 400
    a.splice 0
    expect(observer.notifications.length).toBe 5
    expect(observer.notifications[4].old).toBe 400
    expect(observer.notifications[4].new).toBeNull()

describe 'Z.Array#push', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  it 'should return the receiver', ->
    expect(a.push 4).toBe a

  it 'should append the given object(s) to the end of the array', ->
    a.push 4
    expect(a).toEq Z.A [1,2,3,4]
    a.push 10, 11, 12
    expect(a).toEq Z.A [1,2,3,4,10,11,12]

describe 'Z.Array.unshift', ->
  a = null
  beforeEach -> a = Z.A([1,2,3])

  it 'should return the receiver', ->
    expect(a.unshift 4).toBe a

  it 'should prepend the given object(s) to the beginning of the array', ->
    a.unshift 4
    expect(a).toEq Z.A [4,1,2,3]
    a.unshift 10, 11, 12
    expect(a).toEq Z.A [10,11,12,4,1,2,3]

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
      expect(a).toEq Z.A [1,2]
      a.pop()
      expect(a).toEq Z.A [1]
      a.pop()
      expect(a).toEq Z.A []
      a.pop()
      expect(a).toEq Z.A []

  describe 'with an integer argument', ->
    it 'should return the last n items in a Z.Array', ->
      expect(Z.A([1,2,3]).pop(0)).toEq Z.A []
      expect(Z.A([1,2,3]).pop(1)).toEq Z.A [3]
      expect(Z.A([1,2,3]).pop(2)).toEq Z.A [2,3]
      expect(Z.A([1,2,3]).pop(3)).toEq Z.A [1,2,3]
      expect(Z.A([1,2,3]).pop(4)).toEq Z.A [1,2,3]

    it 'should remove the last n items from the array', ->
      a = new Z.Array 1,2,3,4,5,6,7

      a.pop 0
      expect(a).toEq Z.A([1,2,3,4,5,6,7])
      a.pop 1
      expect(a).toEq Z.A([1,2,3,4,5,6])
      a.pop 2
      expect(a).toEq Z.A([1,2,3,4])
      a.pop 5
      expect(a).toEq Z.A([])

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
      expect(a).toEq Z.A [2,3]
      a.shift()
      expect(a).toEq Z.A [3]
      a.shift()
      expect(a).toEq Z.A []
      a.shift()
      expect(a).toEq Z.A []

  describe 'with an integer arugment', ->
    it 'should return the first n items in a Z.Array', ->
      expect(Z.A([1,2,3]).shift(0)).toEq Z.A []
      expect(Z.A([1,2,3]).shift(1)).toEq Z.A [1]
      expect(Z.A([1,2,3]).shift(2)).toEq Z.A [1,2]
      expect(Z.A([1,2,3]).shift(3)).toEq Z.A [1,2,3]
      expect(Z.A([1,2,3]).shift(4)).toEq Z.A [1,2,3]

    it 'should remove the first n items from the array', ->
      a = new Z.Array 1,2,3,4,5,6,7

      a.shift 0
      expect(a).toEq Z.A([1,2,3,4,5,6,7])
      a.shift 1
      expect(a).toEq Z.A([2,3,4,5,6,7])
      a.shift 2
      expect(a).toEq Z.A([4,5,6,7])
      a.shift 5
      expect(a).toEq Z.A([])

    it 'should throw an exception if given a negative number', ->
      a = new Z.Array
      expect(-> a.shift(-1)).toThrow("Z.Array#shift: array size must be positive")

describe 'Z.Array#concat', ->
  a = null

  beforeEach -> a = Z.A [1,2,3]

  it 'should return a new array containing the contents of the receiver concatenated with the contents of the given array', ->
    b = a.concat Z.A [4,5,6]
    expect(a).toEq Z.A [1,2,3]
    expect(b).toEq Z.A [1,2,3,4,5,6]

  it 'should append the argument when given a single non-array argument', ->
    expect(a.concat(4)).toEq Z.A [1,2,3,4]

  it 'should append the contents of the given native array', ->
    expect(a.concat([10,11,12])).toEq Z.A [1,2,3,10,11,12]

  it 'should handle multiple arguments', ->
    r = a.concat 4, [5,6], Z.A(7,8,9), 10, 11
    expect(r).toEq Z.A [1..11]

describe 'Z.Array#flatten', ->
  it 'should return a new array that removes all levels of nested arrays', ->
    a = Z.A [1, 2, [3, 4], Z.A([5, 6, 7]), 8, [9], [[10, 11], 12], [[[[13]]]]]
    expect(a.flatten()).toEq Z.A [1..13]

describe 'Z.Array#join', ->
  class Foo extends Z.Object
    @property 'x'
    toString: -> "foo-#{@x()}"

  it 'should return a string created by converting each item of the array to a string separated by the given separator', ->
    a1 = Z.A 1,2,3,4,5
    a2 = Z.A new Foo(x: 1), new Foo(x: 2), new Foo(x: 3)

    expect(a1.join '-').toEqual '1-2-3-4-5'
    expect(a2.join ' , ').toEqual 'foo-1 , foo-2 , foo-3'

describe 'Z.Array#each', ->
  a = Z.A 'a', 'b', 'c', 'd'

  it 'should yield each item in the array to the given function', ->
    test = []
    a.each (item) -> test.push item
    expect(test).toEqual ['a', 'b', 'c', 'd']

  it 'should yield the index of each item in the array to the given function', ->
    test = []
    a.each (item, idx) -> test.push idx
    expect(test).toEqual [0, 1, 2, 3]

describe 'Z.Array#getUnknownProperty', ->
  class Foo extends Z.Object
    @property 'bar'
  class Bar extends Z.Object
    @property 'x'

  it 'should get the given property path from each item in the array and return a new array with the values', ->
    b1 = new Bar x: 1
    b2 = new Bar x: 2
    b3 = new Bar x: 3
    f1 = new Foo bar: b1
    f2 = new Foo bar: b2
    f3 = new Foo bar: b3
    a  = Z.A f1, f2, f3

    expect(a.getUnknownProperty('bar')).toEq Z.A [b1, b2, b3]
    expect(a.get('bar')).toEq Z.A [b1, b2, b3]

    expect(a.getUnknownProperty('bar.x')).toEq Z.A [1, 2, 3]
    expect(a.get('bar.x')).toEq Z.A [1, 2, 3]

describe 'Z.Array KVC collection operators:', ->
  class Transaction extends Z.Object
    @property 'payee'
    @property 'amount'
    @property 'date'

  transactions = null
  beforeEach ->
    transactions = Z.A [
      new Transaction payee: 'Green Power',     amount: 120,  date: new Date 2009, 11, 1
      new Transaction payee: 'Green Power',     amount: 150,  date: new Date 2010, 0, 1
      new Transaction payee: 'Green Power',     amount: 170,  date: new Date 2010, 1, 1
      new Transaction payee: 'Car Loan',        amount: 250,  date: new Date 2010, 0, 15
      new Transaction payee: 'Car Loan',        amount: 250,  date: new Date 2010, 1, 15
      new Transaction payee: 'Car Loan',        amount: 250,  date: new Date 2010, 2, 15
      new Transaction payee: 'General Cable',   amount: 120,  date: new Date 2009, 11, 1
      new Transaction payee: 'General Cable',   amount: 155,  date: new Date 2010, 0, 1
      new Transaction payee: 'General Cable',   amount: 120,  date: new Date 2010, 2, 1
      new Transaction payee: 'Mortgage',        amount: 1250, date: new Date 2010, 0, 15
      new Transaction payee: 'Mortgage',        amount: 1250, date: new Date 2010, 1, 15
      new Transaction payee: 'Mortgage',        amount: 1250, date: new Date 2010, 2, 15
      new Transaction payee: 'Animal Hospital', amount: 600,  date: new Date 2010, 6, 15
    ]

  describe '@count', ->
    it 'should return the number of objects in the left key path', ->
      expect(transactions.get '@count').toBe 13

    it 'should ignore any keys that appear after the operator', ->
      expect(transactions.get '@count.stuff.things').toBe 13

  describe '@max', ->
    it 'should return the maximum value from the values of the property specified by the key path to the right of the operator', ->
      expect(transactions.get '@max.date').toEqual new Date 2010, 6, 15
      expect(transactions.get '@max.amount').toBe 1250

  describe '@min', ->
    it 'should return the minimum value from the values of the property specified by the key path to the right of the operator', ->
      expect(transactions.get '@min.date').toEqual new Date 2009, 11, 1
      expect(transactions.get '@min.amount').toBe 120

  describe '@sum', ->
    it 'should return the sum of the values of the property specified by the key path to the right of the operator', ->
      expect(transactions.get '@sum.amount').toBe 5935

  describe '@avg', ->
    it 'should return the average of the values of the property specified by the key path to the right', ->
      avg = parseFloat transactions.get('@avg.amount').toFixed 2
      expect(avg).toBe 456.54

