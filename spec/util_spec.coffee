Z = this.Z || require 'zoom'

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

