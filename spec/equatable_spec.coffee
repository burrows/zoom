Z = this.Z || require 'zoom'

class A extends Z.Object
  @mixin Z.Equatable
  @property 'foo'
  eq: (other) -> @foo() == other.foo()

class B extends Z.Object
  @mixin Z.Equatable
  @property 'foo'
  neq: (other) -> @foo() != other.foo()

describe 'Z.Equatable#eq', ->
  it 'should work when #neq is defined', ->
    b1 = new B foo: 1; b2 = new B foo: 1

    expect(b1.eq b2).toBe true
    expect(b2.eq b1).toBe true
    b1.foo 9
    expect(b1.eq b2).toBe false
    expect(b2.eq b1).toBe false

describe 'Z.Equatable#neq', ->
  it 'should work when #eq is defined', ->
    a1 = new A foo: 1; a2 = new A foo: 1

    expect(a1.neq a2).toBe false
    expect(a2.neq a1).toBe false
    a2.foo 7
    expect(a1.neq a2).toBe true
    expect(a2.neq a1).toBe true

describe 'Z.eq', ->
  it 'should invoke #eq if the first object implements Equatable', ->
    a1 = new A foo: 1; a2 = new A foo: 1

    expect(a1 == a2).toBe false
    expect(Z.eq a1, a2).toBe true
    a2.foo 2
    expect(a1 == a2).toBe false
    expect(Z.eq a1, a2).toBe false

  it 'should fall back to using the == operator if the first object does not implement Equatable', ->
    expect(Z.eq 'foo', 'foo').toBe true
    expect(Z.eq 'foo', 'bar').toBe false
    expect(Z.eq 9, 9).toBe true
    expect(Z.eq 9, 10).toBe false
    expect(Z.eq null, 0).toBe false
