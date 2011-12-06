Z = this.Z || require 'zoom'

class Foo extends Z.Object
  @mixin Z.Orderable
  @property 'x'
  cmp: (other) ->
    return false unless other instanceof Foo
    return Z.cmp @x(), other.x()

fa = new Foo x: 1
fb = new Foo x: 2
fc = new Foo x: 1

describe 'Z.Orderable#lt', ->
  it 'should return true when the receiver is less than the given object and false otherwise', ->
    expect(fa.lt fb).toBe true
    expect(fb.lt fa).toBe false
    expect(fa.lt fc).toBe false

describe 'Z.Orderable#lte', ->
  it 'should return true when the receiver is less than or equal to the given object and false otherwise', ->
    expect(fa.lte fb).toBe true
    expect(fa.lte fc).toBe true
    expect(fb.lte fa).toBe false

describe 'Z.Orderable#gt', ->
  it 'should return true when the receiver is greater than the given object and false otherwise', ->
    expect(fb.gt fa).toBe true
    expect(fa.gt fb).toBe false
    expect(fa.gt fc).toBe false

describe 'Z.Orderable#gt', ->
  it 'should return true when the receiver is greater than or equal to the given object and false otherwise', ->
    expect(fb.gte fa).toBe true
    expect(fa.gte fc).toBe true
    expect(fa.gte fb).toBe false

describe 'Z.Orderable#max', ->
  it 'should return the receiver if it is greater than or equal to the given object and the object otherwise', ->
    expect(fa.max fc).toBe fa
    expect(fb.max fa).toBe fb
    expect(fa.max fb).toBe fb

describe 'Z.Orderable#min', ->
  it 'should return the receiver if it is less than or equal to the given object and the object otherwise', ->
    expect(fa.min fc).toBe fa
    expect(fb.min fc).toBe fc
    expect(fa.min fb).toBe fa

describe 'Z.cmp', ->
  it 'should call Z.Orderable#cmp if the first object is an orderable', ->
    spyOn fa, 'cmp'
    Z.cmp fa, fb
    expect(fa.cmp).toHaveBeenCalledWith fb

  it 'should fall back to using native js operators when first object is not orderable', ->
    expect(Z.cmp 1, 2).toBe -1
    expect(Z.cmp 2, 1).toBe 1
    expect(Z.cmp 2, 2).toBe 0
    expect(Z.cmp 'foo', 'bar').toBe 1
    expect(Z.cmp 'bar', 'foo').toBe -1
    expect(Z.cmp 'abc', 'abc').toBe 0
    expect(Z.cmp new Date(2010, 5, 5), new Date(2011, 5, 5)).toBe -1
    expect(Z.cmp new Date(2011, 5, 5), new Date(2010, 5, 5)).toBe 1
    expect(Z.cmp new Date(2011, 5, 5), new Date(2011, 5, 5)).toBe 0

