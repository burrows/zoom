Z = this.Z || require 'zoom'

describe 'Z.merge', ->
  it 'should merge values from sources objects into the given destination object', ->
    r = Z.merge({foo: 1, bar: 2}, {bar: 9, baz: 3})
    expect(r).toEqual {foo:1, bar: 9, baz: 3}
    r = Z.merge({foo: 1, bar: 2}, {bar: 9, baz: 3}, {bar: 10, quux: 12})
    expect(r).toEqual {foo:1, bar: 10, baz: 3, quux: 12}

describe 'Z.defaults', ->
  it 'should merge values from default objects that are not present in the given object', ->
    r = Z.defaults({foo: 1, bar: 2}, {bar: 9, baz: 3})
    expect(r).toEqual {foo:1, bar: 2, baz: 3}
    r = Z.defaults({foo: 1, bar: 2}, {bar: 9, baz: 3}, {quux: 12})
    expect(r).toEqual {foo:1, bar: 2, baz: 3, quux: 12}

describe 'Z.isNativeArray', ->
  it 'should return true for native arrays', ->
    expect(Z.isNativeArray [1,2,3]).toBe true

  it 'should return false for arguments objects', ->
    (-> expect(Z.isNativeArray arguments).toBe false)()

  it 'should return false for Z.Arrays', ->
    expect(Z.isNativeArray Z.A()).toBe false

describe 'Z.eq', ->
  class A extends Z.Object
    @property 'foo'
    eq: (other) -> @foo() == other.foo()

  it 'should invoke #eq if the first object is a Z.Object', ->
    a1 = new A foo: 1; a2 = new A foo: 1

    expect(a1 == a2).toBe false
    expect(Z.eq a1, a2).toBe true
    a2.foo 2
    expect(a1 == a2).toBe false
    expect(Z.eq a1, a2).toBe false

  it 'should fall back to using the == operator if the first object is not a Z.Object', ->
    expect(Z.eq 'foo', 'foo').toBe true
    expect(Z.eq 'foo', 'bar').toBe false
    expect(Z.eq 9, 9).toBe true
    expect(Z.eq 9, 10).toBe false
    expect(Z.eq null, 0).toBe false

