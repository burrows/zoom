(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Array constructor', function() {
  it('should create an array of the given size when passed a single number', function() {
    var a = Z.Array.create(3);
    expect(a.size()).toBe(3);
    expect(a.at(0)).toBeUndefined();
    expect(a.at(1)).toBeUndefined();
    expect(a.at(2)).toBeUndefined();
  });

  it('should create an array whose contents are the given native array', function() {
    var a1 = Z.Array.create([1, 2]),
        a2 = Z.Array.create(['a', 'b', 'c']);

    expect(a1.size()).toBe(2);
    expect(a1.at(0)).toBe(1);
    expect(a1.at(1)).toBe(2);
    expect(a2.size()).toBe(3);
    expect(a2.at(0)).toEqual('a');
    expect(a2.at(1)).toEqual('b');
    expect(a2.at(2)).toEqual('c');
  });

  it('should create an array whose contents are the given Arguments object', function() {
    var f     = function() { return arguments; },
        args1 = f(),
        args2 = f(1,2,3);

    expect(Z.Array.create(args1)).toEq(Z.A());
    expect(Z.Array.create(args2)).toEq(Z.A(1,2,3));
  });

  it('should create an array whose contents are the given Z.Array', function() {
    var a1 = Z.Array.create(Z.Array.create([1, 2])),
        a2 = Z.Array.create(Z.Array.create(['a', 'b', 'c']));

    expect(a1.size()).toBe(2);
    expect(a1.at(0)).toBe(1);
    expect(a1.at(1)).toBe(2);
    expect(a2.size()).toBe(3);
    expect(a2.at(0)).toEqual('a');
    expect(a2.at(1)).toEqual('b');
    expect(a2.at(2)).toEqual('c');
  });

  it('should create an empty array when no arguments are given', function() {
    var a = Z.Array.create();
    expect(a.size()).toBe(0);
  });
});

describe('Z.A', function() {
  it('should return a Z.Array containing all of the given arguments when there are multiple arguments', function() {
    expect(Z.A(1,2,3)).toEq(Z.Array.create([1,2,3]));
  });

  it('should return a Z.Array of length 1 containing the argument when one non-array argument is given', function() {
    var a1 = Z.A(9), a2 = Z.A('a');

    expect(a1.size()).toBe(1);
    expect(a1).toEq(Z.Array.create([9]));
    expect(a2.size()).toBe(1);
    expect(a2).toEq(Z.Array.create(['a']));
  });

  it('should return an empty Z.Array when given no arguments', function() {
    expect(Z.A()).toEq(Z.Array.create());
  });
});

describe('Z.Array.toString', function() {
  it('should return a string with the prototype name, object id, and array contents', function() {
    var a = Z.A(1, 2, 3);
    expect(a.toString()).toEqual("#<Z.Array:" + a.objectId + " [1, 2, 3]>");
  });

  it('should handle recursive arrays', function() {
    var a1 = Z.A(), a2 = Z.A();

    a1.push(a1);
    a2.push([9, a2]);

    expect(a1.toString()).toEqual(Z.fmt("#<Z.Array:%@ [#<Z.Array:%@ [...]>]>", a1.objectId, a1.objectId));
    expect(a2.toString()).toEqual(Z.fmt("#<Z.Array:%@ [[9, #<Z.Array:%@ [...]>]]>", a2.objectId, a2.objectId));
  });
});

describe('Z.Array.toNative', function() {
  it('should return a native array with the contents of the Z.Array', function() {
    var za = Z.A('x', 'y'), a = za.toNative();

    expect(a instanceof Array).toBe(true);
    expect(a).toEqual(['x', 'y']);
  });
});

describe('Z.Array `size` property', function() {
  it('should return the current size of the array', function() {
    expect((Z.Array.create(8)).size()).toBe(8);
    expect((Z.Array.create([1, 2, 3])).get('size')).toBe(3);
    expect(Z.A(1, 2, 3, 4).size()).toBe(4);
  });

  it('should update when the array changes', function() {
    var a = Z.A(1, 2, 3);

    expect(a.size()).toBe(3);
    a.pop();
    expect(a.size()).toBe(2);
    a.push(4);
    expect(a.size()).toBe(3);
  });

  it('should update the length of the array when set', function() {
    var a = Z.Array.create();

    expect(a.get('size')).toBe(0);
    a.size(9);
    expect(a.get('size')).toBe(9);
    expect(a.toNative().length).toBe(9);
    a.set('size', 5);
    expect(a.get('size')).toBe(5);
    expect(a.toNative().length).toBe(5);
  });

  it('should notify observers when the size changes', function() {
    var a        = Z.A(1, 2, 3, 4, 5),
        observer = { notifications: [], action: function(n) { this.notifications.push(n); } };

    a.observe('size', observer, 'action', { previous: true, current: true });
    a.push(6);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].previous).toBe(5);
    expect(observer.notifications[0].current).toBe(6);
    a.unshift(0);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].previous).toBe(6);
    expect(observer.notifications[1].current).toBe(7);
    a.pop();
    expect(observer.notifications.length).toBe(3);
    expect(observer.notifications[2].previous).toBe(7);
    expect(observer.notifications[2].current).toBe(6);
    a.at(0, 10);
    expect(observer.notifications.length).toBe(3);
    a.at(20, 20);
    expect(observer.notifications.length).toBe(4);
    expect(observer.notifications[3].previous).toBe(6);
    expect(observer.notifications[3].current).toBe(21);
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

    it('should return `null` when given a positive index that is out of range', function() {
      expect(a.at(4)).toBeNull();
      expect(a.at(112)).toBeNull();
    });

    it('should return `null` when given a negative index that is out of range', function() {
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
      a.at(2, 'two');
      expect(a.at(2)).toBe('two');
      a.at(2, undefined);
      expect(a.at(2)).toBeUndefined();
    });

    it('should return the value', function() {
      expect(a.at(1, 'slow')).toBe('slow');
    });
  });
});

describe('Z.Array.index', function() {
  it('should return the index of the first object in the array that is equal to the given object', function() {
    expect(Z.A(0,1,2,3).index(0)).toBe(0);
    expect(Z.A(0,1,2,3).index(2)).toBe(2);
    expect(Z.A(0,1,2,1).index(1)).toBe(1);
    expect(Z.A(Z.A(1, 2), Z.A(3, 4), Z.A(5, 6)).index(Z.A(3, 4))).toBe(1);
  });

  it('should return `null` if the item does not exist in the array', function() {
    expect(Z.A(0,1,2,3).index(4)).toBe(null);
    expect(Z.A(Z.A(1, 2), Z.A(3, 4), Z.A(5, 6)).index(Z.A(3, 4, 5))).toBe(null);
  });
});

describe('Z.Array.contains', function() {
  it('should return `true` if the given object exists in the array and false otherwise', function() {
    expect(Z.A(0,1,2,3).contains(0)).toBe(true);
    expect(Z.A(0,1,2,3).contains(2)).toBe(true);
    expect(Z.A(0,1,2,3).contains(3)).toBe(true);
    expect(Z.A(0,1,2,3).contains(4)).toBe(false);
    expect(Z.A(Z.A(1,2), Z.A(3,4)).contains(Z.A(3,4))).toBe(true);
    expect(Z.A(Z.A(1,2), Z.A(3,4)).contains(Z.A(1,3))).toBe(false);
  });
});

describe('Z.Array.splice', function() {
  it('should return the receiver', function() {
    var a = Z.A(1, 2, 3);
    expect(a.splice(0, 1, 100)).toBe(a);
  });

  describe('with 1 argument', function() {
    it('should remove all remaining items starting at the given index', function() {
      expect(Z.A(0, 1, 2).splice(0)).toEq(Z.A());
      expect(Z.A(0, 1, 2).splice(1)).toEq(Z.A(0));
      expect(Z.A(0, 1, 2).splice(2)).toEq(Z.A(0, 1));
      expect(Z.A(0, 1, 2).splice(3)).toEq(Z.A(0, 1, 2));
    });
  });

  describe('with a positive index in range', function() {
    it('should replace the given number of items starting at the given index with the given objects', function() {
      expect(Z.A(0, 1, 2).splice(0, 0)).toEq(Z.A(0, 1, 2));
      expect(Z.A(0, 1, 2).splice(0, 1)).toEq(Z.A(1, 2));
      expect(Z.A(0, 1, 2).splice(1, 1)).toEq(Z.A(0, 2));
      expect(Z.A(0, 1, 2).splice(1, 2)).toEq(Z.A(0));
      expect(Z.A(0, 1, 2).splice(1, 20)).toEq(Z.A(0));
      expect(Z.A(0, 1, 2).splice(0, 1, 100)).toEq(Z.A(100, 1, 2));
      expect(Z.A(0, 1, 2).splice(1, 2, 'a', 'b')).toEq(Z.A(0, 'a', 'b'));
      expect(Z.A(0, 1, 2).splice(1, 2, 'a', 'b', 'c', 'd')).toEq(Z.A(0, 'a', 'b', 'c', 'd'));
    });
  });

  describe('with a positive index out of range', function() {
    it('should grow the length of the array', function() {
      expect(Z.A(0, 1, 2).splice(4, 0, 'x')).toEq(Z.A(0, 1, 2, void 0, 'x'));
      expect(Z.A(0, 1, 2).splice(4, 0, 'x', 'y', 'z')).toEq(Z.A(0, 1, 2, void 0, 'x', 'y', 'z'));
      expect(Z.A(0, 1, 2).splice(4, 2, 'x', 'y', 'z')).toEq(Z.A(0, 1, 2, void 0, 'x', 'y', 'z'));
    });
  });

  describe('with a negative index in range', function() {
    it('should replace the given number of items starting at the index from the right with the given objects', function() {
      expect(Z.A(0, 1, 2).splice(-3, 0)).toEq(Z.A(0, 1, 2));
      expect(Z.A(0, 1, 2).splice(-3, 1)).toEq(Z.A(1, 2));
      expect(Z.A(0, 1, 2).splice(-2, 1)).toEq(Z.A(0, 2));
      expect(Z.A(0, 1, 2).splice(-2, 2)).toEq(Z.A(0));
      expect(Z.A(0, 1, 2).splice(-2, 20)).toEq(Z.A(0));
      expect(Z.A(0, 1, 2).splice(-3, 1, 100)).toEq(Z.A(100, 1, 2));
      expect(Z.A(0, 1, 2).splice(-2, 2, 'a', 'b')).toEq(Z.A(0, 'a', 'b'));
      expect(Z.A(0, 1, 2).splice(-2, 2, 'a', 'b', 'c', 'd')).toEq(Z.A(0, 'a', 'b', 'c', 'd'));
    });
  });

  describe('with a negative index out of range', function() {
    it('should throw an exception', function() {
      var a = Z.A(0, 1, 2);

      expect(function() {
        a.splice(-12);
      }).toThrow("Z.Array.splice: index `-12` is too small for " + (a.toString()));
    });
  });
});

describe('Z.Array.replace', function() {
  it('should replace the contents of the receiver with the given `Z.Array` contents', function() {
    var a = Z.A(1,2,3);
    a.replace(Z.A('foo', 'bar'));
    expect(a).toEq(Z.A('foo', 'bar'));
  });

  it('should replace the contents of the receiver with the given native array contents', function() {
    var a = Z.A(1,2,3);
    a.replace([10, 11, 12, 13]);
    expect(a).toEq(Z.A(10, 11, 12, 13));
  });
});

describe('Z.Array.remove', function() {
  it('should return the receiver', function() {
    var a = Z.A(1,2,3);
    expect(a.remove(1)).toBe(a);
  });

  it('should remove all objects in the array that are equal to the given object', function() {
    expect(Z.A(1,2,3,2).remove(2)).toEq(Z.A(1,3));
    expect(Z.A(Z.A(1,2), Z.A(3, 4), Z.A(4, 5), Z.A(3, 4)).remove(Z.A(3, 4))).toEq(Z.A(Z.A(1,2), Z.A(4, 5)));
  });
});

describe('Z.Array.slice', function() {
  var a = null;

  beforeEach(function() { a = Z.A(0, 1, 2, 3, 4, 5); });

  describe('given just an index', function() {
    it('should return a new Z.Array with only the items at the given index and after', function() {
      expect(a.slice(0)).toEq(Z.A(0, 1, 2, 3, 4, 5));
      expect(a.slice(1)).toEq(Z.A(1, 2, 3, 4, 5));
      expect(a.slice(2)).toEq(Z.A(2, 3, 4, 5));
      expect(a.slice(-1)).toEq(Z.A(5));
      expect(a.slice(-2)).toEq(Z.A(4, 5));
      expect(a.slice(-3)).toEq(Z.A(3, 4, 5));
    });

    it('should return `null` when given an out of bounds index', function() {
      expect(a.slice(20)).toBe(null);
      expect(a.slice(-20)).toBe(null);
    });
  });

  describe('given an index and a length', function() {
    it('should return a new Z.Array containing the item at the given index and continuing for n items', function() {
      expect(a.slice(0, 0)).toEq(Z.A());
      expect(a.slice(0, 1)).toEq(Z.A(0));
      expect(a.slice(0, 3)).toEq(Z.A(0, 1, 2));
      expect(a.slice(2, 2)).toEq(Z.A(2, 3));
      expect(a.slice(2, 4)).toEq(Z.A(2, 3, 4, 5));
      expect(a.slice(2, 8)).toEq(Z.A(2, 3, 4, 5));
      expect(a.slice(-6, 0)).toEq(Z.A());
      expect(a.slice(-6, 1)).toEq(Z.A(0));
      expect(a.slice(-6, 3)).toEq(Z.A(0, 1, 2));
      expect(a.slice(-4, 2)).toEq(Z.A(2, 3));
      expect(a.slice(-4, 4)).toEq(Z.A(2, 3, 4, 5));
      expect(a.slice(-4, 8)).toEq(Z.A(2, 3, 4, 5));
    });

    it('should return `null` when given an out of bounds index', function() {
      expect(a.slice(20, 2)).toBeNull();
      expect(a.slice(-20, 2)).toBeNull();
    });
  });
});

describe('Z.Array.slice$', function() {
  it('should return `null` and not mutate the receiver if the given index is out of bounds', function() {
    var a = Z.A(0, 1, 2, 3, 4, 5);

    expect(a.slice$(20)).toBeNull();
    expect(a).toEq(Z.A(0, 1, 2, 3, 4, 5));
    expect(a.slice$(-20)).toBeNull();
    expect(a).toEq(Z.A(0, 1, 2, 3, 4, 5));
  });

  it('should return the same thing as slice, but mutate the receiver in the process', function() {
    var a = Z.A(0, 1, 2, 3, 4, 5);

    expect(a.slice$(0)).toEq(Z.A(0, 1, 2, 3, 4, 5));
    expect(a).toEq(Z.A());
    a = Z.A(0, 1, 2, 3, 4, 5);
    expect(a.slice$(4)).toEq(Z.A(4, 5));
    expect(a).toEq(Z.A(0, 1, 2, 3));
    a = Z.A(0, 1, 2, 3, 4, 5);
    expect(a.slice$(2, 2)).toEq(Z.A(2, 3));
    expect(a).toEq(Z.A(0, 1, 4, 5));
  });
});

describe('Z.Array.clear', function() {
  it('should remove all items from the array', function() {
    var a = Z.A(1,2,3);

    expect(a.size()).toBe(3);
    a.clear();
    expect(a.size()).toBe(0);
    a.clear();
    expect(a.size()).toBe(0);
  });
});

describe('Z.Array.eq', function() {
  it('should return `false` if any corresponding items are not equal', function() {
    expect(Z.A('a', 'b', 'c').eq(Z.A('a', 'b', 'd'))).toBe(false);
    expect(Z.A(NaN).eq(Z.A(NaN))).toBe(false);
  });

  it('should return `true` if all corresponding items are equal', function() {
    expect(Z.A().eq(Z.A())).toBe(true);
    expect(Z.A(1,2,3).eq(Z.A(1,2,3))).toBe(true);
  });

  it('should handle recursive arrays', function() {
    var a1 = Z.A(Z.A(1)), a2 = Z.A(Z.A(1));

    a1.push(a1);
    a2.push(a2);

    expect(a1.eq(a2)).toBe(true);
    expect(a2.eq(a1)).toBe(true);
  });

  it('should try to convert the argument to an array using `toArray` if its not already an array', function() {
    var X = Z.Object.extend(function() {
      this.def('toArray', function() { return Z.A(1); });
    });

    expect(Z.A(1).eq(X.create())).toBe(true);
    expect(Z.A(Z.A(1)).eq(Z.A(X.create()))).toBe(true);
    expect(Z.A(Z.A(1), 2, 3).eq(Z.A(X.create(), 2, 3))).toBe(true);
  });

  it("should return `false` when given an argument that is not an array and can't be converted to an array", function() {
    expect((Z.A()).eq("foo")).toBe(false);
    expect((Z.A()).eq([])).toBe(false);
    expect((Z.A()).eq({})).toBe(false);
    expect((Z.A()).eq(Z.Object.create())).toBe(false);
  });
});

describe('Z.Array.cmp', function() {
  it('should return 0 when the arrays are equal', function() {
    expect(Z.A().cmp(Z.A())).toBe(0);
    expect(Z.A(1,2,3,4,5).cmp(Z.A(1,2,3,4,5))).toBe(0);
  });

  it('should return -1 if the receiver is shorter than the other array', function() {
    expect(Z.A().cmp(Z.A(1))).toBe(-1);
    expect(Z.A(1,1).cmp(Z.A(1,1,1))).toBe(-1);
  });

  it('should return 1 if the receiver is longer than the other array', function() {
    expect(Z.A(1).cmp(Z.A())).toBe(1);
    expect(Z.A(1,1,1).cmp(Z.A(1,1))).toBe(1);
  });

  it('should return -1 if the arrays are the same length and a pair is encountered where the item in the receiver is less than the item in the other array', function() {
    expect(Z.A(10,20,30).cmp(Z.A(10,21,30))).toBe(-1);
  });

  it('should return 1 if the arrays are the same length and a pair is encountered where the item in the receiver is greater than the item in the other array', function() {
    expect(Z.A(10,20,30).cmp(Z.A(10,19,30))).toBe(1);
  });

  it('should handle recursive arrays', function() {
    var empty = Z.A(), rec = Z.A(1,2,3);

    empty.push(empty);
    rec.push(rec, rec, rec);

    expect(empty.cmp(empty)).toBe(0);
    expect(empty.cmp(Z.A())).toBe(1);
    expect(Z.A().cmp(empty)).toBe(-1);

    expect(rec.cmp(Z.A())).toBe(1);
    expect(Z.A().cmp(rec)).toBe(-1);

    expect(rec.cmp(rec)).toBe(0);
  });

  it('should try to convert the argument to an array using `toArray` if its not already an array', function() {
    var X = Z.Object.extend(function() {
      this.def('toArray', function() { return Z.A(1,2,3); });
    });

    expect(Z.A(1,2,3).cmp(X.create())).toBe(0);
    expect(Z.A(1,2).cmp(X.create())).toBe(-1);
    expect(Z.A(1,2,3,4).cmp(X.create())).toBe(1);
  });

  it("should return `null` when the argument is not an array and can't be converted to an array", function() {
    expect(Z.A().cmp(Z.Object.create())).toBeNull();
    expect(Z.A().cmp(null)).toBeNull();
    expect(Z.A().cmp(false)).toBeNull();
  });
});

describe('Z.Array `first` property', function() {
  it('should return the first object in the array', function() {
    expect(Z.A(5, 6, 7).first()).toBe(5);
  });

  it('should return `null` when the array is empty', function() {
    expect(Z.A().first()).toBe(null);
  });

  it('should notify observers when changed', function() {
    var observer = { notifications: [], action: function(n) { this.notifications.push(n); } },
        a        = Z.A(1, 2, 3);

    a.observe('first', observer, 'action', { previous: true, current: true });
    a.at(0, 10);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].previous).toBe(1);
    expect(observer.notifications[0].current).toBe(10);
    a.shift();
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].previous).toBe(10);
    expect(observer.notifications[1].current).toBe(2);
    a.unshift(9);
    expect(observer.notifications.length).toBe(3);
    expect(observer.notifications[2].previous).toBe(2);
    expect(observer.notifications[2].current).toBe(9);
    a.splice(0);
    expect(observer.notifications.length).toBe(4);
    expect(observer.notifications[3].previous).toBe(9);
    expect(observer.notifications[3].current).toBeNull();
  });
});

describe('Z.Array `last` property', function() {
  it('should return the last object in the array', function() {
    expect(Z.A(5, 6, 7).last()).toBe(7);
  });

  it('should return `null` when the array is empty', function() {
    expect(Z.A().last()).toBe(null);
  });

  it('should notify observers when changed', function() {
    var observer = { notifications: [], action: function(n) { this.notifications.push(n); } },
        a        = Z.A(1, 2, 3);

    a.observe('last', observer, 'action', { previous: true, current: true });
    a.at(2, 30);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].previous).toBe(3);
    expect(observer.notifications[0].current).toBe(30);
    a.pop();
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].previous).toBe(30);
    expect(observer.notifications[1].current).toBe(2);
    a.push(9);
    expect(observer.notifications.length).toBe(3);
    expect(observer.notifications[2].previous).toBe(2);
    expect(observer.notifications[2].current).toBe(9);
    a.splice(1, 2, 100, 200, 300, 400);
    expect(observer.notifications.length).toBe(4);
    expect(observer.notifications[3].previous).toBe(9);
    expect(observer.notifications[3].current).toBe(400);
    a.splice(0);
    expect(observer.notifications.length).toBe(5);
    expect(observer.notifications[4].previous).toBe(400);
    expect(observer.notifications[4].current).toBeNull();
  });
});

describe('Z.Array.push', function() {
  var a = null;

  beforeEach(function() { a = Z.A(1, 2, 3); });

  it('should return the receiver', function() {
    expect(a.push(4)).toBe(a);
  });

  it('should append the given object(s) to the end of the array', function() {
    a.push(4);
    expect(a).toEq(Z.A(1, 2, 3, 4));
    a.push(10, 11, 12);
    expect(a).toEq(Z.A(1, 2, 3, 4, 10, 11, 12));
  });
});

describe('Z.Array.unshift', function() {
  var a = null;

  beforeEach(function() { a = Z.A(1, 2, 3); });

  it('should return the receiver', function() {
    expect(a.unshift(4)).toBe(a);
  });

  it('should prepend the given object(s) to the beginning of the array', function() {
    a.unshift(4);
    expect(a).toEq(Z.A(4, 1, 2, 3));
    a.unshift(10, 11, 12);
    expect(a).toEq(Z.A(10, 11, 12, 4, 1, 2, 3));
  });
});

describe('Z.Array.pop', function() {
  var a;

  beforeEach(function() { a = Z.A(1, 2, 3); });

  describe('with no arguments', function() {
    it('should return the last item in the array', function() {
      expect(a.pop()).toBe(3);
    });

    it('should return `null` when the array is empty', function() {
      expect(Z.A().pop()).toBe(null);
    });

    it('should remove the last item from the array', function() {
      a.pop();
      expect(a).toEq(Z.A(1, 2));
      a.pop();
      expect(a).toEq(Z.A(1));
      a.pop();
      expect(a).toEq(Z.A());
      a.pop();
      expect(a).toEq(Z.A());
    });
  });

  describe('with an integer argument', function() {
    it('should return the last n items in a Z.Array', function() {
      expect(Z.A(1, 2, 3).pop(0)).toEq(Z.A());
      expect(Z.A(1, 2, 3).pop(1)).toEq(Z.A(3));
      expect(Z.A(1, 2, 3).pop(2)).toEq(Z.A(2, 3));
      expect(Z.A(1, 2, 3).pop(3)).toEq(Z.A(1, 2, 3));
      expect(Z.A(1, 2, 3).pop(4)).toEq(Z.A(1, 2, 3));
    });

    it('should remove the last n items from the array', function() {
      a = Z.A(1, 2, 3, 4, 5, 6, 7);
      a.pop(0);
      expect(a).toEq(Z.A(1, 2, 3, 4, 5, 6, 7));
      a.pop(1);
      expect(a).toEq(Z.A(1, 2, 3, 4, 5, 6));
      a.pop(2);
      expect(a).toEq(Z.A(1, 2, 3, 4));
      a.pop(5);
      expect(a).toEq(Z.A());
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

    it('should return `null` when the array is empty', function() {
      expect(Z.A().shift()).toBe(null);
    });

    it('should remove the first item from the array', function() {
      a.shift();
      expect(a).toEq(Z.A(2, 3));
      a.shift();
      expect(a).toEq(Z.A(3));
      a.shift();
      expect(a).toEq(Z.A());
      a.shift();
      expect(a).toEq(Z.A());
    });
  });

  describe('with an integer arugment', function() {
    it('should return the first n items in a Z.Array', function() {
      expect(Z.A(1, 2, 3).shift(0)).toEq(Z.A());
      expect(Z.A(1, 2, 3).shift(1)).toEq(Z.A(1));
      expect(Z.A(1, 2, 3).shift(2)).toEq(Z.A(1, 2));
      expect(Z.A(1, 2, 3).shift(3)).toEq(Z.A(1, 2, 3));
      expect(Z.A(1, 2, 3).shift(4)).toEq(Z.A(1, 2, 3));
    });

    it('should remove the first n items from the array', function() {
      a = Z.A(1, 2, 3, 4, 5, 6, 7);
      a.shift(0);
      expect(a).toEq(Z.A(1, 2, 3, 4, 5, 6, 7));
      a.shift(1);
      expect(a).toEq(Z.A(2, 3, 4, 5, 6, 7));
      a.shift(2);
      expect(a).toEq(Z.A(4, 5, 6, 7));
      a.shift(5);
      expect(a).toEq(Z.A());
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

  beforeEach(function() { a = Z.A(1, 2, 3); });

  it('should return a new array containing the contents of the receiver concatenated with the contents of the given array', function() {
    var b = a.concat(Z.A(4, 5, 6));

    expect(a).toEq(Z.A(1, 2, 3));
    expect(b).toEq(Z.A(1, 2, 3, 4, 5, 6));
  });

  it('should append the argument when given a single non-array argument', function() {
    expect(a.concat(4)).toEq(Z.A(1, 2, 3, 4));
  });

  it('should append the contents of the given native array', function() {
    expect(a.concat([10, 11, 12])).toEq(Z.A(1, 2, 3, 10, 11, 12));
  });

  it('should handle multiple arguments', function() {
    var r = a.concat(4, [5, 6], Z.A(7, 8, 9), 10, 11);

    expect(r).toEq(Z.A(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11));
  });
});

describe('Z.Array.flatten', function() {
  it('should return a new array that removes all levels of nested arrays', function() {
    var a = Z.A(1, 2, [3, 4], Z.A([5, 6, 7]), 8, [9], [[10, 11], 12], [[[[13]]]]);

    expect(a.flatten()).toEq(Z.A(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13));
  });
});

describe('Z.Array.join', function() {
  var Foo = Z.Object.extend(Z.Observable, function() {
    this.prop('x');

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

  it('should invoke the method on each item when given a string', function() {
    var o1 = Z.Object.create(),
        o2 = Z.Object.create(),
        a  = Z.A(o1, o2);

    spyOn(o1, 'toString')
    spyOn(o2, 'toString')
    a.each('toString');
    expect(o1.toString).toHaveBeenCalled();
    expect(o2.toString).toHaveBeenCalled();
  });
});

describe('Z.Array.getUnknownProperty', function() {
  var Foo, Bar;

  Foo = Z.Object.extend(Z.Observable, function() {
    this.prop('bar');
  });

  Bar = Z.Object.extend(Z.Observable, function() {
    this.prop('x');
  });

  it('should get the given property path from each item in the array and return a new array with the values', function() {
    var b1 = Bar.create({x: 1}),
        b2 = Bar.create({x: 2}),
        b3 = Bar.create({x: 3}),
        f1 = Foo.create({bar: b1}),
        f2 = Foo.create({bar: b2}),
        f3 = Foo.create({bar: b3}),
        a  = Z.A(f1, f2, f3);

    expect(a.getUnknownProperty('bar')).toEq(Z.A(b1, b2, b3));
    expect(a.get('bar')).toEq(Z.A(b1, b2, b3));
    expect(a.getUnknownProperty('bar.x')).toEq(Z.A(1, 2, 3));
    expect(a.get('bar.x')).toEq(Z.A(1, 2, 3));
  });

  it('should flatten the results', function() {
    var b1 = Bar.create({x: Z.A(1, 2, 3)}),
        b2 = Bar.create({x: Z.A(4, 5)}),
        b3 = Bar.create({x: Z.A(6, 7, 8)}),
        f1 = Foo.create({bar: b1}),
        f2 = Foo.create({bar: b2}),
        f3 = Foo.create({bar: b3}),
        a  = Z.A(f1, f2, f3);

    expect(a.getUnknownProperty('bar.x')).toEq(Z.A(1, 2, 3, 4, 5, 6, 7, 8));
    expect(a.get('bar.x')).toEq(Z.A(1, 2, 3, 4, 5, 6, 7, 8));
  });
});

describe('Z.Array.setUnknownProperty', function() {
  var Foo, Bar;

  Foo = Z.Object.extend(Z.Observable, function() {
    this.prop('bar');
  });

  Bar = Z.Object.extend(Z.Observable, function() {
    this.prop('x');
  });

  it('should set the given property path on each item in the array', function() {
    var b1 = Bar.create({x: 1}),
        b2 = Bar.create({x: 2}),
        b3 = Bar.create({x: 3}),
        f1 = Foo.create({bar: b1}),
        f2 = Foo.create({bar: b2}),
        f3 = Foo.create({bar: b3}),
        a1 = Z.A(f1, f2, f3),
        a2 = Z.A(b1, b2, b3);

    a2.set('x', 9);
    expect(b1.x()).toBe(9);
    expect(b2.x()).toBe(9);
    expect(b3.x()).toBe(9);

    a1.set('bar.x', 12);
    expect(b1.x()).toBe(12);
    expect(b2.x()).toBe(12);
    expect(b3.x()).toBe(12);
  });
});

describe('Z.Array `@` property', function() {
  var a, observer;

  beforeEach(function() {
    observer = { notifications: [], action: function(n) { this.notifications.push(n); } };
    a = Z.A(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
    a.observe('@', observer, 'action', { previous: true, current: true });
  });

  it('should return the array object', function() {
    expect(a.get('@')).toBe(a);
  });

  it('should notify observers when items are appended to the end of the array', function() {
    a.push(10);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].range).toEqual([10, 1]);
    expect(observer.notifications[0].previous).toBeUndefined();
    expect(observer.notifications[0].current).toEq(Z.A(10));
    a.push(11, 12, 13);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEqual('insert');
    expect(observer.notifications[1].range).toEqual([11, 3]);
    expect(observer.notifications[1].previous).toBeUndefined();
    expect(observer.notifications[1].current).toEq(Z.A(11, 12, 13));
  });

  it('should notify observers when items are prepended to the beginning of the array', function() {
    a.unshift(21);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].range).toEqual([0, 1]);
    expect(observer.notifications[0].previous).toBeUndefined();
    expect(observer.notifications[0].current).toEq(Z.A(21));
    a.unshift(22, 23);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEqual('insert');
    expect(observer.notifications[1].range).toEqual([0, 2]);
    expect(observer.notifications[1].previous).toBeUndefined();
    expect(observer.notifications[1].current).toEq(Z.A(22, 23));
  });

  it('should notify observers when items are inserted into the middle of the array', function() {
    a.splice(3, 0, 10, 11, 12);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('insert');
    expect(observer.notifications[0].range).toEqual([3, 3]);
    expect(observer.notifications[0].previous).toBeUndefined();
    expect(observer.notifications[0].current).toEq(Z.A(10, 11, 12));
  });

  it('should notify observers when items are removed from the end of the array', function() {
    a.pop(2);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].range).toEqual([8, 2]);
    expect(observer.notifications[0].previous).toEq(Z.A(8, 9));
    expect(observer.notifications[0].current).toBeUndefined();
  });

  it('should notify observers when items are removed from the beginning of the array', function() {
    a.shift(2);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].range).toEqual([0, 2]);
    expect(observer.notifications[0].previous).toEq(Z.A(0, 1));
    expect(observer.notifications[0].current).toBeUndefined();
  });

  it('should notify observers when items are removed from the middle of the array', function() {
    a.splice(4, 2);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('remove');
    expect(observer.notifications[0].range).toEqual([4, 2]);
    expect(observer.notifications[0].previous).toEq(Z.A(4, 5));
    expect(observer.notifications[0].current).toBeUndefined();
  });

  it('should notify observers when items are replaced in the array', function() {
    a.at(0, 19);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEqual('update');
    expect(observer.notifications[0].range).toEqual([0, 1]);
    expect(observer.notifications[0].previous).toEq(Z.A(0));
    expect(observer.notifications[0].current).toEq(Z.A(19));
    a.splice(2, 4, 20, 30, 40, 50);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEqual('update');
    expect(observer.notifications[1].range).toEqual([2, 4]);
    expect(observer.notifications[1].previous).toEq(Z.A(2, 3, 4, 5));
    expect(observer.notifications[1].current).toEq(Z.A(20, 30, 40, 50));
  });

  it('should notify observers when items are both replaced and inserted', function() {
    a.splice(2, 2, 20, 30, 40, 50);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[0].type).toEqual('update');
    expect(observer.notifications[0].range).toEqual([2, 2]);
    expect(observer.notifications[0].previous).toEq(Z.A(2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(20, 30));
    expect(observer.notifications[1].type).toEqual('insert');
    expect(observer.notifications[1].range).toEqual([4, 2]);
    expect(observer.notifications[1].previous).toBeUndefined();
    expect(observer.notifications[1].current).toEq(Z.A(40, 50));
  });

  it('should notify observers when items are both replaced and removed', function() {
    a.splice(2, 4, 20, 30);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[0].type).toEqual('update');
    expect(observer.notifications[0].range).toEqual([2, 2]);
    expect(observer.notifications[0].previous).toEq(Z.A(2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(20, 30));
    expect(observer.notifications[1].type).toEqual('remove');
    expect(observer.notifications[1].range).toEqual([4, 2]);
    expect(observer.notifications[1].previous).toEq(Z.A(4, 5));
    expect(observer.notifications[1].current).toBeUndefined();
  });

  it('should not include the `previous` key in the notification when the `previous` option is not set', function() {
    var observer2 = { notifications: [], action: function(n) { this.notifications.push(n); } };
    a.observe('@', observer2, 'action', { prior: true, previous: false });
    a.pop();
    expect(observer2.notifications.length).toBe(2);
    expect(observer2.notifications[0].hasOwnProperty('previous')).toBe(false);
    expect(observer2.notifications[1].hasOwnProperty('previous')).toBe(false);
  });

  it('should not include the `current` key in the notification when the `current` option is not set', function() {
    var observer2 = { notifications: [], action: function(n) { this.notifications.push(n); } };
    a.observe('@', observer2, 'action', { prior: true, current: false });
    a.pop();
    expect(observer2.notifications.length).toBe(2);
    expect(observer2.notifications[0].hasOwnProperty('current')).toBe(false);
    expect(observer2.notifications[1].hasOwnProperty('current')).toBe(false);
  });
});

describe('Z.Array.observe with an unknown property', function() {
  var Foo, a, observer;

  Foo = Z.Object.extend(Z.Observable, function() {
    this.prop('x');
  });

  observer = { notifications: [], action: function(n) { this.notifications.push(n); } };

  beforeEach(function() {
    observer.notifications = [];
    a = Z.A(Foo.create({x: 1}), Foo.create({x: 2}), Foo.create({x: 3}));
    a.observe('x', observer, 'action', { previous: true, current: true });
  });

  it('should trigger notifications when items are added to the array', function() {
    a.push(Foo.create({x: 4}));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 3, 4));
  });

  it('should trigger notifications when items are removed from the array', function() {
    a.pop();
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2));
  });

  it('should trigger notifications when items are replaced in the array', function() {
    a.at(0, Foo.create({x: 9}));
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(9, 2, 3));
  });

  it('should trigger notifications when the property with the given name changes on any item', function() {
    a.at(1).set('x', 23);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(1, 23, 3));
    a.at(2).set('x', 11);
    expect(observer.notifications[1].type).toBe('change');
    expect(observer.notifications[1].previous).toEq(Z.A(1, 23, 3));
    expect(observer.notifications[1].current).toEq(Z.A(1, 23, 11));
  });

  it('should trigger a notification immediately when the fire option is given', function() {
    var observer2 = {
      notifications: [],
      action: function(n) { this.notifications.push(n); }
    };

    a.observe('x', observer2, 'action', { previous: true, current: true, fire: true });

    expect(observer2.notifications.length).toBe(1);
    expect(observer2.notifications[0].type).toBe('change');
    expect(observer2.notifications[0].hasOwnProperty('previous')).toBe(false);
    expect(observer2.notifications[0].current).toEq(Z.A(1, 2, 3));
  });

  it('should not trigger notifications when an item that was once but is no longer in the array changes', function() {
    var item = a.last();

    item.set('x', 7);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 7));
    a.pop();
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toBe('change');
    expect(observer.notifications[1].previous).toEq(Z.A(1, 2, 7));
    expect(observer.notifications[1].current).toEq(Z.A(1, 2));
    item.set('x', 8);
    expect(observer.notifications.length).toBe(2);
  });

  it('should trigger notifications when an item that was not originally in the array changes', function() {
    var item = Foo.create({x: 12});

    a.unshift(item);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toBe('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3));
    expect(observer.notifications[0].current).toEq(Z.A(12, 1, 2, 3));
    item.x(13);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toBe('change');
    expect(observer.notifications[1].previous).toEq(Z.A(12, 1, 2, 3));
    expect(observer.notifications[1].current).toEq(Z.A(13, 1, 2, 3));
  });
});

describe('Z.Array.stopObservering with an unknown property', function() {
  var Foo, a, observer;

  Foo = Z.Object.extend(Z.Observable, function() {
    this.prop('x');
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

  Foo = Z.Object.extend(Z.Observable, function() {
    this.prop('bars');
  });

  Bar = Z.Object.extend(Z.Observable, function() {
    this.prop('bazs');
  });

  Baz = Z.Object.extend(Z.Observable, function() {
    this.prop('x');
  });

  observer = {
    notifications: [],
    action: function(n) { this.notifications.push(n); }
  };

  beforeEach(function() {
    observer.notifications = [];

    f = Foo.create({
      bars: Z.A(
        Bar.create({ bazs: Z.A(Baz.create({x: 1}), Baz.create({x: 2}), Baz.create({x: 3})) }),
        Bar.create({ bazs: Z.A(Baz.create({x: 4}), Baz.create({x: 5})) })
      )
    });

    f.observe('bars.bazs.x', observer, 'action', { previous: true, current: true });
  });

  it('should trigger notifications when the first level array is replaced', function() {
    f.set('bars', Z.A());
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A());
  });

  it('should trigger notifications when items are added to the first level array', function() {
    f.bars().push(Bar.create({ bazs: Z.A( Baz.create({x: 6}) ) }));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 3, 4, 5, 6));
  });

  it('should trigger notifications when items are removed from the first level array', function() {
    f.bars().pop();
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 3));
  });

  it('should trigger notifications when items are replaced from the first level array', function() {
    f.bars().at(0, Bar.create({ bazs: Z.A( Baz.create({x: 6}) ) }));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(6, 4, 5));
  });

  it('should trigger notifications when a second level array is replaced', function() {
    f.set('bars.first.bazs', Z.A( Baz.create({x: 9}) ));
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(9, 4, 5));
  });

  it('should trigger notifications when items are added to the second level array', function() {
    f.get('bars.first.bazs').push(Baz.create({x: 10}));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 3, 10, 4, 5));
  });

  it('should trigger notifications when items are removed from the second level array', function() {
    f.get('bars.first.bazs').pop();
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 4, 5));
  });

  it('should trigger notifications when items are replaced from the second level array', function() {
    f.get('bars.first.bazs').at(1, Baz.create({x: 22}));

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(1, 22, 3, 4, 5));
  });

  it('should trigger notifications when any of the leaf properties change', function() {
    f.set('bars.first.bazs.first.x', 11);
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(11, 2, 3, 4, 5));
    f.set('bars.last.bazs.last.x', 55);
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].type).toEq('change');
    expect(observer.notifications[1].previous).toEq(Z.A(11, 2, 3, 4, 5));
    expect(observer.notifications[1].current).toEq(Z.A(11, 2, 3, 4, 55));
  });

  it('should not trigger notifications when a first level replaced array mutates', function() {
    var bars = f.bars();

    f.bars(Z.A());
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A());
    bars.pop();
    expect(observer.notifications.length).toBe(1);
  });

  it('should not trigger notifications when a second level replaced array mutates', function() {
    var bazs = f.get('bars.first.bazs');

    f.set('bars.first.bazs', Z.A());
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(4, 5));
    bazs.pop();
    expect(observer.notifications.length).toBe(1);
  });

  it('should not trigger notifications when a leaf property on a removed object changes', function() {
    var baz = f.get('bars.first.bazs').pop();

    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].type).toEq('change');
    expect(observer.notifications[0].previous).toEq(Z.A(1, 2, 3, 4, 5));
    expect(observer.notifications[0].current).toEq(Z.A(1, 2, 4, 5));
    baz.set('x', 33);
    expect(observer.notifications.length).toBe(1);
  });
});

describe('Z.Array.hash', function() {
  it('should return a number', function() {
    expect(typeof Z.A().hash()).toBe('number');
    expect(typeof Z.A(1,2,'three').hash()).toBe('number');
  });

  it('should return the same value for equivalent arrays', function() {
    expect(Z.A().hash()).toBe(Z.A().hash());
    expect(Z.A('x').hash()).toBe(Z.A('x').hash());
    expect(Z.A(1,2,'three').hash()).toBe(Z.A(1,2,'three').hash());
  });

  it('should return different values for arrays with the same items but in different orders', function() {
    expect(Z.A(1,2).hash()).not.toBe(Z.A(2,1).hash());
    expect(Z.A('one', 'two', 3).hash()).not.toBe(Z.A('two', 3, 1).hash());
  });

  it('should generate a value for recursive arrays', function() {
    var a = Z.A(), b = Z.A(1, 'two', 3.0);

    a.push(a);
    b.push(b, b, b, b, b);

    expect(typeof a.hash()).toBe('number');
    expect(typeof b.hash()).toBe('number');
  });

  it('should return the same value for equal recursive arrays', function() {
    var a = Z.A();
    a.push(a);

    expect(a.hash()).toBe(Z.A(a).hash());
    expect(a.hash()).toBe(Z.A(Z.A(a)).hash());
  });

  it('should return the same value for equal recursive arrays through hashes', function() {
    var h = Z.H(), a = Z.A(h);
    h.at('x', a);

    expect(a.hash()).toBe(Z.A(h).hash());
    expect(a.hash()).toBe(Z.A(Z.H('x', a)).hash());
  });
});

describe('Z.Array.toArray', function() {
  describe('given a direct instance of `Z.Array`', function() {
    it('should return the receiver', function() {
      var a = Z.A(1,2,3);
      expect(a.toArray()).toBe(a);
    });
  });

  describe('given an instance of a sub-type of `Z.Array`', function() {
    it('should create a new instance of `Z.Array` with the contents of the receiver', function() {
      var SubArray = Z.Array.extend(), sa = SubArray.create();

      sa.push(1, 2, 3, 5);
      expect(sa.toArray()).not.toBe(sa);
      expect(sa.toArray()).toEq(Z.A(1,2,3,5));
    });
  });
});

describe('Z.Array.sort', function() {
  var Foo = Z.Object.extend(Z.Orderable, Z.Observable, function() {
    this.prop('x');

    this.def('eq', function(other) {
      return this.x() === other.x();
    });

    this.def('cmp', function(other) {
      return Z.cmp(this.x(), other.x());
    });
  });

  describe('given no arguments', function() {
    it('should return a new `Z.Array` instance with the items sorted using `Z.cmp` as the comparison function', function() {
      var f1 = Foo.create({x: 9}), f2 = Foo.create({x: 2}), f3 = Foo.create({x: 4});

      expect(Z.A(4,8,2,5,1,7,3).sort()).toEq(Z.A(1,2,3,4,5,7,8));
      expect(Z.A('foo', 'bar', 'baz').sort()).toEq(Z.A('bar', 'baz', 'foo'));
      expect(Z.A(f1, f2, f3).sort()).toEq(Z.A(f2, f3, f1));
    });
  });

  describe('given a function argument', function() {
    it('should use the given function as the comparison function', function() {
      var f1 = Foo.create({x: 9}), f2 = Foo.create({x: 2}), f3 = Foo.create({x: 4}),
          cmp = function(a, b) { return Z.cmp(a, b) * -1; };

      expect(Z.A(4,8,2,5,1,7,3).sort(cmp)).toEq(Z.A(8,7,5,4,3,2,1));
      expect(Z.A('foo', 'bar', 'baz').sort(cmp)).toEq(Z.A('foo', 'baz', 'bar'));
      expect(Z.A(f1, f2, f3).sort(cmp)).toEq(Z.A(f1, f3, f2));
    });
  });

  it('should not modify the receiver', function() {
    var f1 = Foo.create({x: 10}), f2 = Foo.create({x: 11}), f3 = Foo.create({x: 3}),
        a = Z.A(f1, f2, f3);

    expect(a.sort()).toEq(Z.A(f3, f1, f2));
    expect(a).toEq(Z.A(f1, f2, f3));
  });

  it('should not trigger observers', function() {
    var a = Z.A(3,1,2), called = false, f = function() { called = true; };

    a.observe('@', null, f);
    a.sort();
    expect(called).toBe(false);
  });
});

describe('Z.Array.sort$', function() {
  describe('given no arguments', function() {
    it('should sort the array in place using `Z.cmp` as the comparison function', function() {
      var a = Z.A(5,2,7,1,9,3);

      expect(a.sort$()).toBe(a);
      expect(a).toEq(Z.A(1,2,3,5,7,9));
    });
  });

  describe('given a function argument', function() {
    it('should sort the array in place using the given function as the comparison function', function() {
      var a = Z.A(5,2,7,1,9,3), cmp = function(a, b) { return Z.cmp(a, b) * -1; };

      expect(a.sort$(cmp)).toBe(a);
      expect(a).toEq(Z.A(9,7,5,3,2,1));
    });
  });

  it('should trigger `@` observers', function() {
    var a             = Z.A('the', 'quick', 'brown', 'fox'),
        notifications = [],
        f             = function(n) { notifications.push(n); };

    a.observe('@', null, f);
    a.sort$();
    expect(notifications.length).toBe(1);
    expect(notifications[0].path).toBe('@');
    expect(notifications[0].range).toEq([0, 4]);
  });

  it('should not throw an exception when the array is empty', function() {
    expect(function() { Z.A().sort$(); }).not.toThrow();
  });
});

describe('Z.Array.sortBy', function() {
  var n = 0, X = Z.Object.extend(Z.Observable, function() {
    this.prop('foo', {
      get: function() { n++; return this.__foo__;}
    });
  }), x1, x2, x3, x5, x7;

  x3 = X.create({foo: 3});
  x7 = X.create({foo: 7});
  x2 = X.create({foo: 2});
  x5 = X.create({foo: 5});
  x1 = X.create({foo: 1});

  beforeEach(function() { n = 0; });

  describe('given a string argument', function() {
    it('should sort the array by the value returned by getting the given string from each item', function() {
      expect(Z.A(x3, x7, x2, x5, x1).sortBy('foo')).toEq(Z.A(x1, x2, x3, x5, x7));
    });

    it("should get each item's value only once", function() {
      Z.A(x3, x7, x2, x5, x1).sortBy('foo');
      expect(n).toBe(5);
    });
  });

  describe('given a function argument', function() {
    it('should sort the array by the value returned the given function when passed each item', function() {
      var a = Z.A(x3, x7, x2, x5, x1).sortBy(function(x) { return x.foo() * -1; });
      expect(a).toEq(Z.A(x7, x5, x3, x2, x1));
    });

    it('should only invoke the function once per item', function() {
      var n = 0, f = function(x) { n++; return x.foo() * -1; };

      Z.A(x3, x7, x2, x5, x1).sortBy(f);
      expect(n).toBe(5);
    });
  });
});

describe('Z.array.dup', function() {
  it('should return a new copy of the receiver', function() {
    var a1 = Z.A(1,2,3);
    expect(a1.dup()).toEq(a1);
    expect(a1.dup()).not.toBe(a1);
  });
});

describe('Z.Array.uniq', function() {
  it('should return a new array without duplicate items', function() {
    expect(Z.A(1,2,2,3,3,3,4,4,4,4,5,5,5,5,5).uniq()).toEq(Z.A(1,2,3,4,5));
    expect(Z.A('foo', 'bar', 'foo', 'baz', 'bar', 'quux').uniq()).toEq(Z.A('foo', 'bar', 'baz', 'quux'));
    expect(Z.A([1,2], [3,4], [4,5], [3,4]).uniq()).toEq(Z.A([1,2], [3,4], [4,5]));
  });
});

describe('Z.Array.uniq$', function() {
  it('should remove duplicate items from the receiver', function() {
    var a1 = Z.A(1,2,2,3,3,3,4,4,4,4,5,5,5,5,5),
        a2 = Z.A('foo', 'bar', 'foo', 'baz', 'bar', 'quux'),
        a3 = Z.A([1,2], [3,4], [4,5], [3,4]);

    expect(a1.uniq$()).toBe(a1);
    expect(a1).toEq(Z.A(1,2,3,4,5));
    expect(a2.uniq$()).toBe(a2);
    expect(a2).toEq(Z.A('foo', 'bar', 'baz', 'quux'));
    expect(a3.uniq$()).toBe(a3);
    expect(a3).toEq(Z.A([1,2], [3,4], [4,5]));
  });

  it('should return `null` if no changes were made', function() {
    expect(Z.A(1,2,3).uniq$()).toBeNull();
    expect(Z.A('foo', 'bar').uniq$()).toBeNull();
  });
});

describe('Z.Array.reverse', function() {
  it('should return a new array with its contents reversed', function() {
    expect(Z.A(1,2,3,4,5).reverse()).toEq(Z.A(5,4,3,2,1));
    expect(Z.A([1,2], [3,4]).reverse()).toEq(Z.A([3,4], [1,2]));
  });
});

describe('Z.Array.reverse$', function() {
  it('should reverse the contents in place', function() {
    var a1 = Z.A(1,2,3,4,5),
        a2 = Z.A([1,2], [3,4], [5,6]);

    expect(a1.reverse$()).toBe(a1);
    expect(a1).toEq(Z.A(5,4,3,2,1));
    expect(a2.reverse$()).toBe(a2);
    expect(a2).toEq(Z.A([5,6], [3,4], [1,2]));
  });
});

describe('Z.Array.compact', function() {
  it('should return a new array without `null` or `undefined` items', function() {
    expect(Z.A(1,2,null,3,undefined,4,5).compact()).toEq(Z.A(1,2,3,4,5));
    expect(Z.A(1,2,3).compact()).toEq(Z.A(1,2,3));
  });
});

describe('Z.Array.compact', function() {
  it('should remove `null` and `undefined` items from the receiver', function() {
    var a1 = Z.A(1,null,2,undefined,3,null,4);

    expect(a1.compact$()).toBe(a1);
    expect(a1).toEq(Z.A(1,2,3,4));
  });

  it('should return `null` if no changes were made', function() {
    expect(Z.A(1,2,3).compact$()).toBeNull();
  });
});

}());
