Z = this.Z || require 'zoom'

class Foo extends Z.Object
  @mixin Z.Enumerable
  each: (f) -> f 'foo'; f 'bar'; f 'baz'; f 'quux'

f = new Foo
a = Z.A [1..10]

describe 'Z.Enumerable#inject', ->
  it 'should reduce the enumerable using the given initial object and function', ->
    expect(f.inject '', (acc, x) -> acc + x).toEqual 'foobarbazquux'
    expect(a.inject 0, (acc, x) -> acc + x).toBe 55

  it "should use the first item in the enumerable as the initial value if one isn't given", ->
    expect(f.inject (acc, x) -> acc + x).toEqual 'foobarbazquux'
    expect(a.inject (acc, x) -> acc + x).toBe 55

describe 'Z.Enumerable#map', ->
  it 'should return a Z.Array containing the result of applying the given function to each item in the enumerable', ->
    expect(f.map((x) -> x.toUpperCase()).toNative()).toEqual ['FOO', 'BAR', 'BAZ', 'QUUX']
    expect(a.map((x) -> x * 10).toNative()).toEqual [10,20,30,40,50,60,70,80,90,100]

describe 'Z.Enumerable#first', ->
  it 'should return the first item in the enumerable', ->
    expect((new Foo).first()).toEqual 'foo'

describe 'Z.Enumerable#reject', ->
  it 'should return a Z.Array containing all of the values in the enumerable except those that the given predicate function passes for', ->
    expect(f.reject((x) -> x[0] == 'b').toNative()).toEqual ['foo', 'quux']
    expect(a.reject((x) -> x % 2 != 0).toNative()).toEqual [2,4,6,8,10]

describe 'Z.Enumerable#invoke', ->
  it 'should call the given method on each item in the array and return a new array contain the results', ->
    o1 = new Z.Object; o2 = new Z.Object; o3 = new Z.Object
    a = Z.A o1, o2, o3
    expect(a.invoke('objectId').toNative()).toEqual [o1.objectId(), o2.objectId(), o3.objectId()]

