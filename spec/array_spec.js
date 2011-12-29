(function() {

if (typeof Z === 'undefined') { require('./helper'); }

describe('Z.Array constructor', function() {
  it('should create an array of the given size when passed a single number', function() {
    var a = Z.Array.create(3);
    expect(a.length()).toBe(3);
    expect(a.at(0)).toBeUndefined();
    expect(a.at(1)).toBeUndefined();
    expect(a.at(2)).toBeUndefined();
  });

  it('should create an array whose contents are the given native array', function() {
    var a1 = Z.Array.create([1, 2]),
        a2 = Z.Array.create(['a', 'b', 'c']);

    expect(a1.length()).toBe(2);
    expect(a1.at(0)).toBe(1);
    expect(a1.at(1)).toBe(2);
    expect(a2.length()).toBe(3);
    expect(a2.at(0)).toEqual('a');
    expect(a2.at(1)).toEqual('b');
    expect(a2.at(2)).toEqual('c');
  });

  it('should create an array whose contents are the given Z.Array', function() {
    var a1 = Z.Array.create(Z.Array.create([1, 2])),
        a2 = Z.Array.create(Z.Array.create(['a', 'b', 'c']));

    expect(a1.length()).toBe(2);
    expect(a1.at(0)).toBe(1);
    expect(a1.at(1)).toBe(2);
    expect(a2.length()).toBe(3);
    expect(a2.at(0)).toEqual('a');
    expect(a2.at(1)).toEqual('b');
    expect(a2.at(2)).toEqual('c');
  });

  it('should create an empty array when no arguments are given', function() {
    var a = Z.Array.create();
    expect(a.length()).toBe(0);
  });
});

describe('Z.A', function() {
  it('should return a Z.Array containing all of the given arguments when there are multiple arguments', function() { 
    expect(Z.A(1,2,3)).toEq(Z.Array.create([1,2,3]));
  });

  it('should return a Z.Array of length 1 containing the argument when one non-array argument is given', function() {
    var a1 = Z.A(9), a2 = Z.A('a');

    expect(a1.length()).toBe(1);
    expect(a1).toEq(Z.Array.create([9]));
    expect(a2.length()).toBe(1);
    expect(a2).toEq(Z.Array.create(['a']));
  });

  it('should return a Z.Array with the given contents when given a single native array', function() {
    expect(Z.A([1,2,3])).toEq(Z.Array.create([1,2,3]));
  });

  it('should return a Z.Array with the given contents when given a single Z.Array', function() {
    var za = Z.Array.create(['a', 'b']);
    expect(Z.A(za)).toEq(za);
  });

  it('should return an empty Z.Array when given no arguments', function() {
    expect(Z.A()).toEq(Z.Array.create());
  });
});

describe('Z.Array.toString', function() {
  it('should return a string with the class name, object id, and array contents', function() {
    var a = Z.A(1, 2, 3);
    expect(a.toString()).toEqual("#<Z.Array:" + (a.objectId()) + " [1, 2, 3]>");
  });
});

describe('Z.Array.toNative', function() {
  it('should return a native array with the contents of the Z.Array', function() {
    var za = Z.A(['x', 'y']), a = za.toNative();

    expect(a instanceof Array).toBe(true);
    expect(a).toEqual(['x', 'y']);
  });
});

describe('Z.Array `length` property', function() {
  it('should return the current length of the array', function() {
    expect((Z.Array.create(8)).length()).toBe(8);
    expect((Z.Array.create([1, 2, 3])).get('length')).toBe(3);
    expect(Z.A([1, 2, 3, 4]).length()).toBe(4);
  });

  it('should update when the array changes', function() {
    var a = Z.A(1, 2, 3);

    expect(a.length()).toBe(3);
    a.pop();
    expect(a.length()).toBe(2);
    a.push(4);
    expect(a.length()).toBe(3);
  });

  it('should update the length of the array when set', function() {
    var a = Z.Array.create();

    expect(a.get('length')).toBe(0);
    a.length(9);
    expect(a.get('length')).toBe(9);
    expect(a.toNative().length).toBe(9);
    a.set('length', 5);
    expect(a.get('length')).toBe(5);
    expect(a.toNative().length).toBe(5);
  });

  it('should notify observers when the length changes', function() {
    var a        = Z.A([1, 2, 3, 4, 5]),
        observer = { notifications: [], action: function(n) { this.notifications.push(n); } };

    a = Z.A([1, 2, 3, 4, 5]);
    a.observe('length', observer, 'action', { old: true, "new": true });
    a.push(6);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].old).toBe(5);
    expect(observer.notifications[0]["new"]).toBe(6);
    a.unshift(0);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].old).toBe(6);
    expect(observer.notifications[1]["new"]).toBe(7);
    a.pop();
    expect(observer.notifications.length).toBe(3);
    expect(observer.notifications[2].old).toBe(7);
    expect(observer.notifications[2]["new"]).toBe(6);
    a.at(0, 10);
    expect(observer.notifications.length).toBe(3);
    a.at(20, 20);
    expect(observer.notifications.length).toBe(4);
    expect(observer.notifications[3].old).toBe(6);
    expect(observer.notifications[3]["new"]).toBe(21);
  });
});

describe('Z.Array.at', function() {
  var a;

  beforeEach(function() { a = Z.A('the', 'quick', 'brown', 'fox'); });

  describe('given just an index', function() {
    it('should return the value at the given index when given a positive index in range', function() {
      expect(a.at(0)).toBe('the');
      expect(a.at(1)).toBe('quick');
      expect(a.at(2)).toBe('brown');
      expect(a.at(3)).toBe('fox');
    });

    it('should return the value at the index starting from the end when given a negative index in range', function() {
      expect(a.at(-1)).toBe('fox');
      expect(a.at(-2)).toBe('brown');
      expect(a.at(-3)).toBe('quick');
      expect(a.at(-4)).toBe('the');
    });

    it('should return null when given a positive index that is out of range', function() {
      expect(a.at(4)).toBeNull();
      expect(a.at(112)).toBeNull();
    });

    it('should return null when given a negative index that is out of range', function() {
      expect(a.at(-5)).toBeNull();
      expect(a.at(-1743)).toBeNull();
    });
  });

  describe('given an index and a value', function() {
    it('should set the value at the given index', function() {
      expect(a.at(0)).toBe('the');
      a.at(0, 'THE');
      expect(a.at(0)).toBe('THE');
      expect(a.at(-1)).toBe('fox');
      a.at(-1, 'dog');
      expect(a.at(-1)).toBe('dog');
    });

    it('should return the value', function() {
      expect(a.at(1, 'slow')).toBe('slow');
    });
  });
});

describe('Z.Array.splice', function() {
  it('should return the receiver', function() {
    var a = Z.A(1, 2, 3);
    expect(a.splice(0, 1, 100)).toBe(a);
  });

  describe('with 1 argument', function() {
    it('should remove all remaining items starting at the given index', function() {
      expect(Z.A([0, 1, 2]).splice(0)).toEq(Z.A());
      expect(Z.A([0, 1, 2]).splice(1)).toEq(Z.A([0]));
      expect(Z.A([0, 1, 2]).splice(2)).toEq(Z.A([0, 1]));
      expect(Z.A([0, 1, 2]).splice(3)).toEq(Z.A([0, 1, 2]));
    });
  });

  describe('with a positive index in range', function() {
    it('should replace the given number of items starting at the given index with the given objects', function() {
      expect(Z.A([0, 1, 2]).splice(0, 0)).toEq(Z.A([0, 1, 2]));
      expect(Z.A([0, 1, 2]).splice(0, 1)).toEq(Z.A([1, 2]));
      expect(Z.A([0, 1, 2]).splice(1, 1)).toEq(Z.A([0, 2]));
      expect(Z.A([0, 1, 2]).splice(1, 2)).toEq(Z.A([0]));
      expect(Z.A([0, 1, 2]).splice(1, 20)).toEq(Z.A([0]));
      expect(Z.A([0, 1, 2]).splice(0, 1, 100)).toEq(Z.A([100, 1, 2]));
      expect(Z.A([0, 1, 2]).splice(1, 2, 'a', 'b')).toEq(Z.A([0, 'a', 'b']));
      expect(Z.A([0, 1, 2]).splice(1, 2, 'a', 'b', 'c', 'd')).toEq(Z.A([0, 'a', 'b', 'c', 'd']));
    });
  });

  describe('with a positive index out of range', function() {
    it('should grow the length of the array', function() {
      expect(Z.A([0, 1, 2]).splice(4, 0, 'x')).toEq(Z.A([0, 1, 2, void 0, 'x']));
      expect(Z.A([0, 1, 2]).splice(4, 0, 'x', 'y', 'z')).toEq(Z.A([0, 1, 2, void 0, 'x', 'y', 'z']));
      expect(Z.A([0, 1, 2]).splice(4, 2, 'x', 'y', 'z')).toEq(Z.A([0, 1, 2, void 0, 'x', 'y', 'z']));
    });
  });

  describe('with a negative index in range', function() {
    it('should replace the given number of items starting at the index from the right with the given objects', function() {
      expect(Z.A([0, 1, 2]).splice(-3, 0)).toEq(Z.A([0, 1, 2]));
      expect(Z.A([0, 1, 2]).splice(-3, 1)).toEq(Z.A([1, 2]));
      expect(Z.A([0, 1, 2]).splice(-2, 1)).toEq(Z.A([0, 2]));
      expect(Z.A([0, 1, 2]).splice(-2, 2)).toEq(Z.A([0]));
      expect(Z.A([0, 1, 2]).splice(-2, 20)).toEq(Z.A([0]));
      expect(Z.A([0, 1, 2]).splice(-3, 1, 100)).toEq(Z.A([100, 1, 2]));
      expect(Z.A([0, 1, 2]).splice(-2, 2, 'a', 'b')).toEq(Z.A([0, 'a', 'b']));
      expect(Z.A([0, 1, 2]).splice(-2, 2, 'a', 'b', 'c', 'd')).toEq(Z.A([0, 'a', 'b', 'c', 'd']));
    });
  });

  describe('with a negative index out of range', function() {
    it('should throw an exception', function() {
      var a = Z.A([0, 1, 2]);

      expect(function() {
        a.splice(-12);
      }).toThrow("Z.Array.splice: index `-12` is too small for " + (a.toString()));
    });
  });
});

describe('Z.Array.slice', function() {
  var a = null;

  beforeEach(function() { a = Z.A(0, 1, 2, 3, 4, 5); });

  describe('given just an index', function() {
    it('should return a new Z.Array with only the items at the given index and after', function() {
      expect(a.slice(0)).toEq(Z.A([0, 1, 2, 3, 4, 5]));
      expect(a.slice(1)).toEq(Z.A([1, 2, 3, 4, 5]));
      expect(a.slice(2)).toEq(Z.A([2, 3, 4, 5]));
      expect(a.slice(-1)).toEq(Z.A([5]));
      expect(a.slice(-2)).toEq(Z.A([4, 5]));
      expect(a.slice(-3)).toEq(Z.A([3, 4, 5]));
    });

    it('should return null when given an out of bounds index', function() {
      expect(a.slice(20)).toBe(null);
      expect(a.slice(-20)).toBe(null);
    });
  });

  describe('given an index and a length', function() {
    it('should return a new Z.Array containing the item at the given index and continuing for n items', function() {
      expect(a.slice(0, 0)).toEq(Z.A([]));
      expect(a.slice(0, 1)).toEq(Z.A([0]));
      expect(a.slice(0, 3)).toEq(Z.A([0, 1, 2]));
      expect(a.slice(2, 2)).toEq(Z.A([2, 3]));
      expect(a.slice(2, 4)).toEq(Z.A([2, 3, 4, 5]));
      expect(a.slice(2, 8)).toEq(Z.A([2, 3, 4, 5]));
      expect(a.slice(-6, 0)).toEq(Z.A([]));
      expect(a.slice(-6, 1)).toEq(Z.A([0]));
      expect(a.slice(-6, 3)).toEq(Z.A([0, 1, 2]));
      expect(a.slice(-4, 2)).toEq(Z.A([2, 3]));
      expect(a.slice(-4, 4)).toEq(Z.A([2, 3, 4, 5]));
      expect(a.slice(-4, 8)).toEq(Z.A([2, 3, 4, 5]));
    });

    it('should return null when given an out of bounds index', function() {
      expect(a.slice(20, 2)).toBeNull();
      expect(a.slice(-20, 2)).toBeNull();
    });
  });
});

describe('Z.Array.slice$', function() {
  it('should return null and not mutate the receiver if the given index is out of bounds', function() {
    var a = Z.A(0, 1, 2, 3, 4, 5);

    expect(a.slice$(20)).toBeNull();
    expect(a).toEq(Z.A([0, 1, 2, 3, 4, 5]));
    expect(a.slice$(-20)).toBeNull();
    expect(a).toEq(Z.A([0, 1, 2, 3, 4, 5]));
  });

  it('should return the same thing as slice, but mutate the receiver in the process', function() {
    var a = Z.A(0, 1, 2, 3, 4, 5);

    expect(a.slice$(0)).toEq(Z.A([0, 1, 2, 3, 4, 5]));
    expect(a).toEq(Z.A([]));
    a = Z.A(0, 1, 2, 3, 4, 5);
    expect(a.slice$(4)).toEq(Z.A([4, 5]));
    expect(a).toEq(Z.A([0, 1, 2, 3]));
    a = Z.A(0, 1, 2, 3, 4, 5);
    expect(a.slice$(2, 2)).toEq(Z.A([2, 3]));
    expect(a).toEq(Z.A([0, 1, 4, 5]));
  });
});

describe('Z.Array.eq', function() {
  it('should return true when the arrays are identical', function() {
    var a = Z.Array.create();
    expect(a.eq(a)).toBe(true);
  });

  it('should return true when the arrays have the same contents', function() {
    var a1 = Z.A(1, 2, 3);
        a2 = Z.A(1, 2, 3);

    expect(a1.eq(a2)).toBe(true);
  });

  it('should return false when given something other than an array', function() {
    expect((Z.Array.create()).eq("foo")).toBe(false);
    expect((Z.Array.create()).eq([])).toBe(false);
    expect((Z.Array.create()).eq({})).toBe(false);
    expect((Z.Array.create()).eq(Z.Object.create())).toBe(false);
  });

  it('should return false when the array contents differ', function() {
    var a1 = Z.A(1, 2, 3),
        a2 = Z.A(1, 2, 4);

    expect(a1.eq(a2)).toBe(false);
  });
});

describe('Z.Array `first` property', function() {
  it('should return the first object in the array', function() {
    expect(Z.A([5, 6, 7]).first()).toBe(5);
  });

  it('should return null when the array is empty', function() {
    expect(Z.A([]).first()).toBe(null);
  });

  it('should notify observers when changed', function() {
    var observer = { notifications: [], action: function(n) { this.notifications.push(n); } },
        a        = Z.A(1, 2, 3);

    a.observe('first', observer, 'action', { old: true, "new": true });
    a.at(0, 10);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].old).toBe(1);
    expect(observer.notifications[0]["new"]).toBe(10);
    a.shift();
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].old).toBe(10);
    expect(observer.notifications[1]["new"]).toBe(2);
    a.unshift(9);
    expect(observer.notifications.length).toBe(3);
    expect(observer.notifications[2].old).toBe(2);
    expect(observer.notifications[2]["new"]).toBe(9);
    a.splice(0);
    expect(observer.notifications.length).toBe(4);
    expect(observer.notifications[3].old).toBe(9);
    expect(observer.notifications[3]["new"]).toBeNull();
  });
});

describe('Z.Array `last` property', function() {
  it('should return the last object in the array', function() {
    expect(Z.A([5, 6, 7]).last()).toBe(7);
  });

  it('should return null when the array is empty', function() {
    expect(Z.A([]).last()).toBe(null);
  });

  it('should notify observers when changed', function() {
    var observer = { notifications: [], action: function(n) { this.notifications.push(n); } },
        a        = Z.A(1, 2, 3);

    a.observe('last', observer, 'action', { old: true, "new": true });
    a.at(2, 30);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].old).toBe(3);
    expect(observer.notifications[0]["new"]).toBe(30);
    a.pop();
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].old).toBe(30);
    expect(observer.notifications[1]["new"]).toBe(2);
    a.push(9);
    expect(observer.notifications.length).toBe(3);
    expect(observer.notifications[2].old).toBe(2);
    expect(observer.notifications[2]["new"]).toBe(9);
    a.splice(1, 2, 100, 200, 300, 400);
    expect(observer.notifications.length).toBe(4);
    expect(observer.notifications[3].old).toBe(9);
    expect(observer.notifications[3]["new"]).toBe(400);
    a.splice(0);
    expect(observer.notifications.length).toBe(5);
    expect(observer.notifications[4].old).toBe(400);
    expect(observer.notifications[4]["new"]).toBeNull();
  });
});

describe('Z.Array.push', function() {
  var a = null;

  beforeEach(function() { a = Z.A([1, 2, 3]); });

  it('should return the receiver', function() {
    expect(a.push(4)).toBe(a);
  });

  it('should append the given object(s) to the end of the array', function() {
    a.push(4);
    expect(a).toEq(Z.A([1, 2, 3, 4]));
    a.push(10, 11, 12);
    expect(a).toEq(Z.A([1, 2, 3, 4, 10, 11, 12]));
  });
});

describe('Z.Array.unshift', function() {
  var a = null;

  beforeEach(function() { a = Z.A([1, 2, 3]); });

  it('should return the receiver', function() {
    expect(a.unshift(4)).toBe(a);
  });

  it('should prepend the given object(s) to the beginning of the array', function() {
    a.unshift(4);
    expect(a).toEq(Z.A([4, 1, 2, 3]));
    a.unshift(10, 11, 12);
    expect(a).toEq(Z.A([10, 11, 12, 4, 1, 2, 3]));
  });
});

describe('Z.Array.pop', function() {
  var a;

  beforeEach(function() { a = Z.A([1, 2, 3]); });

  describe('with no arguments', function() {
    it('should return the last item in the array', function() {
      expect(a.pop()).toBe(3);
    });

    it('should return null when the array is empty', function() {
      expect(Z.A([]).pop()).toBe(null);
    });

    it('should remove the last item from the array', function() {
      a.pop();
      expect(a).toEq(Z.A([1, 2]));
      a.pop();
      expect(a).toEq(Z.A([1]));
      a.pop();
      expect(a).toEq(Z.A([]));
      a.pop();
      expect(a).toEq(Z.A([]));
    });
  });

  describe('with an integer argument', function() {
    it('should return the last n items in a Z.Array', function() {
      expect(Z.A([1, 2, 3]).pop(0)).toEq(Z.A([]));
      expect(Z.A([1, 2, 3]).pop(1)).toEq(Z.A([3]));
      expect(Z.A([1, 2, 3]).pop(2)).toEq(Z.A([2, 3]));
      expect(Z.A([1, 2, 3]).pop(3)).toEq(Z.A([1, 2, 3]));
      expect(Z.A([1, 2, 3]).pop(4)).toEq(Z.A([1, 2, 3]));
    });

    it('should remove the last n items from the array', function() {
      a = Z.A(1, 2, 3, 4, 5, 6, 7);
      a.pop(0);
      expect(a).toEq(Z.A([1, 2, 3, 4, 5, 6, 7]));
      a.pop(1);
      expect(a).toEq(Z.A([1, 2, 3, 4, 5, 6]));
      a.pop(2);
      expect(a).toEq(Z.A([1, 2, 3, 4]));
      a.pop(5);
      expect(a).toEq(Z.A([]));
    });

    it('should throw an exception if given a negative number', function() {
      a = Z.Array.create();

      expect(function() {
        a.pop(-1);
      }).toThrow("Z.Array.pop: array size must be positive");
    });
  });
});

describe('Z.Array.shift', function() {
  var a;

  beforeEach(function() { a = Z.A(1, 2, 3); });

  describe('with no arguments', function() {
    it('should return the first item in the array', function() {
      expect(a.shift()).toBe(1);
    });

    it('should return null when the array is empty', function() {
      expect(Z.A([]).shift()).toBe(null);
    });

    it('should remove the first item from the array', function() {
      a.shift();
      expect(a).toEq(Z.A([2, 3]));
      a.shift();
      expect(a).toEq(Z.A([3]));
      a.shift();
      expect(a).toEq(Z.A([]));
      a.shift();
      expect(a).toEq(Z.A([]));
    });
  });

  describe('with an integer arugment', function() {
    it('should return the first n items in a Z.Array', function() {
      expect(Z.A([1, 2, 3]).shift(0)).toEq(Z.A([]));
      expect(Z.A([1, 2, 3]).shift(1)).toEq(Z.A([1]));
      expect(Z.A([1, 2, 3]).shift(2)).toEq(Z.A([1, 2]));
      expect(Z.A([1, 2, 3]).shift(3)).toEq(Z.A([1, 2, 3]));
      expect(Z.A([1, 2, 3]).shift(4)).toEq(Z.A([1, 2, 3]));
    });

    it('should remove the first n items from the array', function() {
      a = Z.A(1, 2, 3, 4, 5, 6, 7);
      a.shift(0);
      expect(a).toEq(Z.A([1, 2, 3, 4, 5, 6, 7]));
      a.shift(1);
      expect(a).toEq(Z.A([2, 3, 4, 5, 6, 7]));
      a.shift(2);
      expect(a).toEq(Z.A([4, 5, 6, 7]));
      a.shift(5);
      expect(a).toEq(Z.A([]));
    });

    it('should throw an exception if given a negative number', function() {
      a = Z.Array.create();

      expect(function() {
        a.shift(-1);
      }).toThrow("Z.Array.shift: array size must be positive");
    });
  });
});

describe('Z.Array.concat', function() {
  var a = null;

  beforeEach(function() { a = Z.A([1, 2, 3]); });

  it('should return a new array containing the contents of the receiver concatenated with the contents of the given array', function() {
    var b = a.concat(Z.A([4, 5, 6]));

    expect(a).toEq(Z.A([1, 2, 3]));
    expect(b).toEq(Z.A([1, 2, 3, 4, 5, 6]));
  });

  it('should append the argument when given a single non-array argument', function() {
    expect(a.concat(4)).toEq(Z.A([1, 2, 3, 4]));
  });

  it('should append the contents of the given native array', function() {
    expect(a.concat([10, 11, 12])).toEq(Z.A([1, 2, 3, 10, 11, 12]));
  });

  it('should handle multiple arguments', function() {
    var r = a.concat(4, [5, 6], Z.A(7, 8, 9), 10, 11);

    expect(r).toEq(Z.A([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
  });
});

describe('Z.Array.flatten', function() {
  it('should return a new array that removes all levels of nested arrays', function() {
    var a = Z.A([1, 2, [3, 4], Z.A([5, 6, 7]), 8, [9], [[10, 11], 12], [[[[13]]]]]);

    expect(a.flatten()).toEq(Z.A([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]));
  });
});

describe('Z.Array.join', function() {
  var Foo = Z.Object.extend(function() {
    this.property('x');

    this.def('toString', function() {
      return Z.fmt("foo-%@", this.x());
    });
  });

  it('should return a string created by converting each item of the array to a string separated by the given separator', function() {
    var a1 = Z.A(1, 2, 3, 4, 5),
        a2 = Z.A(Foo.create({x: 1}), Foo.create({x: 2}), Foo.create({x: 3}));

    expect(a1.join('-')).toEqual('1-2-3-4-5');
    expect(a2.join(' , ')).toEqual('foo-1 , foo-2 , foo-3');
  });
});

describe('Z.Array.each', function() {
  var a = Z.A('a', 'b', 'c', 'd');

  it('should yield each item in the array to the given function', function() {
    var test = [];

    a.each(function(item) { test.push(item); });
    expect(test).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should yield the index of each item in the array to the given function', function() {
    var test = [];

    a.each(function(item, idx) { test.push(idx); });
    expect(test).toEqual([0, 1, 2, 3]);
  });
});

describe('Z.Array.getUnknownProperty', function() {
  var Foo, Bar;

  Foo = Z.Object.extend(function() {
    this.property('bar');
  });

  Bar = Z.Object.extend(function() {
    this.property('x');
  });


  it('should get the given property path from each item in the array and return a new array with the values', function() {
    var b1 = Bar.create({x: 1}),
        b2 = Bar.create({x: 2}),
        b3 = Bar.create({x: 3}),
        f1 = Foo.create({bar: b1}),
        f2 = Foo.create({bar: b2}),
        f3 = Foo.create({bar: b3}),
        a  = Z.A(f1, f2, f3);

    expect(a.getUnknownProperty('bar')).toEq(Z.A([b1, b2, b3]));
    expect(a.get('bar')).toEq(Z.A([b1, b2, b3]));
    expect(a.getUnknownProperty('bar.x')).toEq(Z.A([1, 2, 3]));
    expect(a.get('bar.x')).toEq(Z.A([1, 2, 3]));
  });

  it('should flatten the results', function() {
    var b1 = Bar.create({x: Z.A(1, 2, 3)}),
        b2 = Bar.create({x: Z.A(4, 5)}),
        b3 = Bar.create({x: Z.A(6, 7, 8)}),
        f1 = Foo.create({bar: b1}),
        f2 = Foo.create({bar: b2}),
        f3 = Foo.create({bar: b3}),
        a  = Z.A(f1, f2, f3);

    expect(a.getUnknownProperty('bar.x')).toEq(Z.A([1, 2, 3, 4, 5, 6, 7, 8]));
    expect(a.get('bar.x')).toEq(Z.A([1, 2, 3, 4, 5, 6, 7, 8]));
  });
});

describe('Z.Array KVC collection operators:', function() {
  var Transaction, transactions;

  Transaction = Z.Object.extend(function() {
    this.property('payee');
    this.property('amount');
    this.property('date');
  });

  beforeEach(function() {
    transactions = Z.A([
      Transaction.create({ payee: 'Green Power',     amount: 120,  date: new Date(2009, 11, 1) }),
      Transaction.create({ payee: 'Green Power',     amount: 150,  date: new Date(2010, 0, 1) }),
      Transaction.create({ payee: 'Green Power',     amount: 170,  date: new Date(2010, 1, 1) }),
      Transaction.create({ payee: 'Car Loan',        amount: 250,  date: new Date(2010, 0, 15) }),
      Transaction.create({ payee: 'Car Loan',        amount: 250,  date: new Date(2010, 1, 15) }),
      Transaction.create({ payee: 'Car Loan',        amount: 250,  date: new Date(2010, 2, 15) }),
      Transaction.create({ payee: 'General Cable',   amount: 120,  date: new Date(2009, 11, 1) }),
      Transaction.create({ payee: 'General Cable',   amount: 155,  date: new Date(2010, 0, 1) }),
      Transaction.create({ payee: 'General Cable',   amount: 120,  date: new Date(2010, 2, 1) }),
      Transaction.create({ payee: 'Mortgage',        amount: 1250, date: new Date(2010, 0, 15) }),
      Transaction.create({ payee: 'Mortgage',        amount: 1250, date: new Date(2010, 1, 15) }),
      Transaction.create({ payee: 'Mortgage',        amount: 1250, date: new Date(2010, 2, 15) }),
      Transaction.create({ payee: 'Animal Hospital', amount: 600,  date: new Date(2010, 6, 15) })
    ]);
  });

  describe('@count', function() {
    it('should return the number of objects in the left key path', function() {
      expect(transactions.get('@count')).toBe(13);
    });

    it('should ignore any keys that appear after the operator', function() {
      expect(transactions.get('@count.stuff.things')).toBe(13);
    });
  });

  describe('@max', function() {
    it('should return the maximum value from the values of the property specified by the key path to the right of the operator', function() {
      expect(transactions.get('@max.date')).toEqual(new Date(2010, 6, 15));
      expect(transactions.get('@max.amount')).toBe(1250);
    });
  });

  describe('@min', function() {
    it('should return the minimum value from the values of the property specified by the key path to the right of the operator', function() {
      expect(transactions.get('@min.date')).toEqual(new Date(2009, 11, 1));
      expect(transactions.get('@min.amount')).toBe(120);
    });
  });

  describe('@sum', function() {
    it('should return the sum of the values of the property specified by the key path to the right of the operator', function() {
      expect(transactions.get('@sum.amount')).toBe(5935);
    });
  });

  describe('@avg', function() {
    it('should return the average of the values of the property specified by the key path to the right', function() {
      var avg = parseFloat(transactions.get('@avg.amount').toFixed(2));
      expect(avg).toBe(456.54);
    });
  });
});

describe('Z.Array `@` property', function() {
  var a, observer;

  beforeEach(function() {
    observer = { notifications: [], action: function(n) { this.notifications.push(n); } };
    a = Z.A([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    a.observe('@', observer, 'action', { old: true, "new": true });
  });

  it('should notify observers when items are appended to the end of the array', function() {
    a.push(10);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].range).toEqual([10, 1]);
    expect(observer.notifications[0].old).toBeUndefined();
    expect(observer.notifications[0]["new"]).toEq(Z.A([10]));
    a.push(11, 12, 13);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEqual('insert');
    expect(observer.notifications[1].range).toEqual([11, 3]);
    expect(observer.notifications[1].old).toBeUndefined();
    expect(observer.notifications[1]["new"]).toEq(Z.A([11, 12, 13]));
  });

  it('should notify observers when items are prepended to the beginning of the array', function() {
    a.unshift(21);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].range).toEqual([0, 1]);
    expect(observer.notifications[0].old).toBeUndefined();
    expect(observer.notifications[0]["new"]).toEq(Z.A([21]));
    a.unshift(22, 23);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEqual('insert');
    expect(observer.notifications[1].range).toEqual([0, 2]);
    expect(observer.notifications[1].old).toBeUndefined();
    expect(observer.notifications[1]["new"]).toEq(Z.A([22, 23]));
  });

  it('should notify observers when items are inserted into the middle of the array', function() {
    a.splice(3, 0, 10, 11, 12);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].range).toEqual([3, 3]);
    expect(observer.notifications[0].old).toBeUndefined();
    expect(observer.notifications[0]["new"]).toEq(Z.A([10, 11, 12]));
  });

  it('should notify observers when items are removed from the end of the array', function() {
    a.pop(2);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].range).toEqual([8, 2]);
    expect(observer.notifications[0].old).toEq(Z.A([8, 9]));
    expect(observer.notifications[0]["new"]).toBeUndefined();
  });

  it('should notify observers when items are removed from the beginning of the array', function() {
    a.shift(2);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].range).toEqual([0, 2]);
    expect(observer.notifications[0].old).toEq(Z.A([0, 1]));
    expect(observer.notifications[0]["new"]).toBeUndefined();
  });

  it('should notify observers when items are removed from the middle of the array', function() {
    a.splice(4, 2);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].range).toEqual([4, 2]);
    expect(observer.notifications[0].old).toEq(Z.A([4, 5]));
    expect(observer.notifications[0]["new"]).toBeUndefined();
  });

  it('should notify observers when items are replaced in the array', function() {
    a.at(0, 19);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('replace');
    expect(observer.notifications[0].range).toEqual([0, 1]);
    expect(observer.notifications[0].old).toEq(Z.A([0]));
    expect(observer.notifications[0]["new"]).toEq(Z.A([19]));
    a.splice(2, 4, 20, 30, 40, 50);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEqual('replace');
    expect(observer.notifications[1].range).toEqual([2, 4]);
    expect(observer.notifications[1].old).toEq(Z.A([2, 3, 4, 5]));
    expect(observer.notifications[1]["new"]).toEq(Z.A([20, 30, 40, 50]));
  });

  it('should notify observers when items are both replaced and inserted', function() {
    a.splice(2, 2, 20, 30, 40, 50);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[0].type).toEqual('replace');
    expect(observer.notifications[0].range).toEqual([2, 2]);
    expect(observer.notifications[0].old).toEq(Z.A([2, 3]));
    expect(observer.notifications[0]["new"]).toEq(Z.A([20, 30]));
    expect(observer.notifications[1].type).toEqual('insert');
    expect(observer.notifications[1].range).toEqual([4, 2]);
    expect(observer.notifications[1].old).toBeUndefined();
    expect(observer.notifications[1]["new"]).toEq(Z.A([40, 50]));
  });

  it('should notify observers when items are both replaced and removed', function() {
    a.splice(2, 4, 20, 30);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[0].type).toEqual('replace');
    expect(observer.notifications[0].range).toEqual([2, 2]);
    expect(observer.notifications[0].old).toEq(Z.A([2, 3]));
    expect(observer.notifications[0]["new"]).toEq(Z.A([20, 30]));
    expect(observer.notifications[1].type).toEqual('remove');
    expect(observer.notifications[1].range).toEqual([4, 2]);
    expect(observer.notifications[1].old).toEq(Z.A([4, 5]));
    expect(observer.notifications[1]["new"]).toBeUndefined();
  });
});

describe('Z.Array.observe with an unknown property', function() {
  var Foo, a, observer;

  Foo = Z.Object.extend(function() {
    this.property('x');
  });

  observer = { notifications: [], action: function(n) { this.notifications.push(n); } };

  beforeEach(function() {
    observer.notifications = [];
    a = Z.A(Foo.create({x: 1}), Foo.create({x: 2}), Foo.create({x: 3}));
    a.observe('x', observer, 'action', { old: true, "new": true });
  });

  it('should trigger notifications when items are added to the array', function() {
    a.push(Foo.create({x: 4}));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 3, 4));
  });

  it('should trigger notifications when items are removed from the array', function() {
    a.pop();
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2));
  });

  it('should trigger notifications when items are replaced in the array', function() {
    a.at(0, Foo.create({x: 9}));
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0]["new"]).toEq(Z.A(9, 2, 3));
  });

  it('should trigger notifications when the property with the given name changes on any item', function() {
    a.at(1).set('x', 23);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 23, 3));
    a.at(2).set('x', 11);
    expect(observer.notifications[1].type).toBe('change');
    expect(observer.notifications[1].old).toEq(Z.A(1, 23, 3));
    expect(observer.notifications[1]["new"]).toEq(Z.A(1, 23, 11));
  });

  it('should trigger a notification immediately when the fire option is given', function() {
    var observer2 = {
      notifications: [],
      action: function(n) { this.notifications.push(n); }
    };

    a.observe('x', observer2, 'action', { old: true, "new": true, fire: true });

    expect(observer2.notifications.length).toBe(1);
    expect(observer2.notifications[0].type).toBe('change');
    expect(observer2.notifications[0].hasOwnProperty('old')).toBe(false);
    expect(observer2.notifications[0]["new"]).toEq(Z.A(1, 2, 3));
  });

  it('should not trigger notifications when an item that was once but is no longer in the array changes', function() {
    var item = a.last();

    item.set('x', 7);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 7));
    a.pop();
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toBe('change');
    expect(observer.notifications[1].old).toEq(Z.A(1, 2, 7));
    expect(observer.notifications[1]["new"]).toEq(Z.A(1, 2));
    item.set('x', 8);
    expect(observer.notifications.length).toBe(2);
  });

  it('should trigger notifications when an item that was not originally in the array changes', function() {
    var item = Foo.create({x: 12});

    a.unshift(item);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0]["new"]).toEq(Z.A(12, 1, 2, 3));
    item.x(13);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toBe('change');
    expect(observer.notifications[1].old).toEq(Z.A(12, 1, 2, 3));
    expect(observer.notifications[1]["new"]).toEq(Z.A(13, 1, 2, 3));
  });
});

describe('Z.Array.stopObservering with an unknown property', function() {
  var Foo, a, observer;

  Foo = Z.Object.extend(function() {
    this.property('x');
  });

  observer = {
    notifications: [],
    action: function(n) { this.notifications.push(n); }
  };

  beforeEach(function() {
    observer.notifications = [];
    a = Z.A(Foo.create({x: 1}), Foo.create({x: 2}), Foo.create({x: 3}));
    a.observe('x', observer, 'action');
  });

  it('should prevent array mutations from triggering notifications', function() {
    a.push(Foo.create({x: 4}));
    expect(observer.notifications.length).toBe(1);
    a.stopObserving('x', observer, 'action');
    a.push(Foo.create({x: 5}));
    expect(observer.notifications.length).toBe(1);
  });

  it('should prevent property changes from triggering notifications', function() {
    a.at(0).set('x', 11);
    expect(observer.notifications.length).toBe(1);
    a.stopObserving('x', observer, 'action');
    a.at(0).set('x', 111);
    expect(observer.notifications.length).toBe(1);
  });
});

describe('Observing paths that contain multiple arrays with item observers', function() {
  var Foo, Bar, Baz, f, observer;

  Foo = Z.Object.extend(function() {
    this.property('bars');
  });

  Bar = Z.Object.extend(function() {
    this.property('bazs');
  });

  Baz = Z.Object.extend(function() {
    this.property('x');
  });

  observer = {
    notifications: [],
    action: function(n) { this.notifications.push(n); }
  };

  beforeEach(function() {
    observer.notifications = [];

    f = Foo.create({
      bars: Z.A([
        Bar.create({ bazs: Z.A([Baz.create({x: 1}), Baz.create({x: 2}), Baz.create({x: 3})]) }),
        Bar.create({ bazs: Z.A([Baz.create({x: 4}), Baz.create({x: 5})]) })
      ])
    });

    f.observe('bars.bazs.x', observer, 'action', { old: true, "new": true });
  });

  it('should trigger notifications when the first level array is replaced', function() {
    f.set('bars', Z.A());
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A());
  });

  it('should trigger notifications when items are added to the first level array', function() {
    f.bars().push(Bar.create({ bazs: Z.A([ Baz.create({x: 6}) ]) }));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 3, 4, 5, 6));
  });

  it('should trigger notifications when items are removed from the first level array', function() {
    f.bars().pop();
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 3));
  });

  it('should trigger notifications when items are replaced from the first level array', function() {
    f.bars().at(0, Bar.create({ bazs: Z.A([ Baz.create({x: 6}) ]) }));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(6, 4, 5));
  });

  it('should trigger notifications when a second level array is replaced', function() {
    f.set('bars.first.bazs', Z.A([ Baz.create({x: 9}) ]));
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(9, 4, 5));
  });

  it('should trigger notifications when items are added to the second level array', function() {
    f.get('bars.first.bazs').push(Baz.create({x: 10}));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 3, 10, 4, 5));
  });

  it('should trigger notifications when items are removed from the second level array', function() {
    f.get('bars.first.bazs').pop();
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 4, 5));
  });

  it('should trigger notifications when items are replaced from the second level array', function() {
    f.get('bars.first.bazs').at(1, Baz.create({x: 22}));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 22, 3, 4, 5));
  });

  it('should trigger notifications when any of the leaf properties change', function() {
    f.set('bars.first.bazs.first.x', 11);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(11, 2, 3, 4, 5));
    f.set('bars.last.bazs.last.x', 55);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEq('change');
    expect(observer.notifications[1].old).toEq(Z.A(11, 2, 3, 4, 5));
    expect(observer.notifications[1]["new"]).toEq(Z.A(11, 2, 3, 4, 55));
  });

  it('should not trigger notifications when a first level replaced array mutates', function() {
    var bars = f.bars();

    f.bars(Z.A());
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A());
    bars.pop();
    expect(observer.notifications.length).toBe(1);
  });

  it('should not trigger notifications when a second level replaced array mutates', function() {
    var bazs = f.get('bars.first.bazs');

    f.set('bars.first.bazs', Z.A());
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(4, 5));
    bazs.pop();
    expect(observer.notifications.length).toBe(1);
  });

  it('should not trigger notifications when a leaf property on a removed object changes', function() {
    var baz = f.get('bars.first.bazs').pop();

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].old).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0]["new"]).toEq(Z.A(1, 2, 4, 5));
    baz.set('x', 33);
    expect(observer.notifications.length).toBe(1);
  });
});

}());
