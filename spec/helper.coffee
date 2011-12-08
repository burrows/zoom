root = if exports? then global else window

root.Z ?= require 'zoom'

beforeEach ->
  @addMatchers
    toEq: (expected) ->
      @message = ->
        "Expected object #{Z.toString @actual} to eq #{Z.toString expected}"
      Z.eq(@actual, expected)
