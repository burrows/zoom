(function() {
  var Z;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Z = this.Z || require('zoom');

  describe('Z.Array', function() {
    return it('should be defined', function() {
      return expect(Z.Array).toBeDefined();
    });
  });

  describe('Z.Array constructor', function() {
    it('should call super', function() {
      var a;
      a = new Z.Array;
      return expect(typeof a.objectId()).toEqual('number');
    });
    it('should create an array of the given size when passed a single number', function() {
      var a;
      a = new Z.Array(3);
      expect(a.length()).toBe(3);
      expect(a.at(0)).toBeUndefined();
      expect(a.at(1)).toBeUndefined();
      return expect(a.at(2)).toBeUndefined();
    });
    it('should create an array whose contents are the given values when anything other than a single number is passed', function() {
      var a1, a2;
      a1 = new Z.Array(1, 2);
      a2 = new Z.Array('a', 'b', 'c');
      expect(a1.length()).toBe(2);
      expect(a1.at(0)).toBe(1);
      expect(a1.at(1)).toBe(2);
      expect(a2.length()).toBe(3);
      expect(a2.at(0)).toEqual('a');
      expect(a2.at(1)).toEqual('b');
      return expect(a2.at(2)).toEqual('c');
    });
    return it('should create an empty array when no arguments are given', function() {
      var a;
      a = new Z.Array;
      return expect(a.length()).toBe(0);
    });
  });

  describe('Z.Array#toString', function() {
    return it('should return a string with the class name, object id, and array contents', function() {
      var a;
      a = new Z.Array(1, 2, 3);
      return expect(a.toString()).toEqual("#<Z.Array:" + (a.objectId()) + " [1, 2, 3]>");
    });
  });

  describe('Z.Array#toNative', function() {
    return it('should return a native array with the contents of the Z.Array', function() {
      var a, za;
      za = Z.A(['x', 'y']);
      a = za.toNative();
      expect(a instanceof Array).toBe(true);
      return expect(a).toEqual(['x', 'y']);
    });
  });

  describe('Z.Array#length (property)', function() {
    it('should return the current length of the array', function() {
      expect((new Z.Array(8)).length()).toBe(8);
      expect((new Z.Array(1, 2, 3)).get('length')).toBe(3);
      return expect(Z.A([1, 2, 3, 4]).length()).toBe(4);
    });
    it('should update when the array changes', function() {
      var a;
      a = new Z.Array(1, 2, 3);
      expect(a.length()).toBe(3);
      a.pop();
      expect(a.length()).toBe(2);
      a.push(4);
      return expect(a.length()).toBe(3);
    });
    return it('should update the length of the array when set', function() {
      var a;
      a = new Z.Array;
      expect(a.get('length')).toBe(0);
      a.length(9);
      expect(a.get('length')).toBe(9);
      expect(a.toNative().length).toBe(9);
      a.set('length', 5);
      expect(a.get('length')).toBe(5);
      return expect(a.toNative().length).toBe(5);
    });
  });

  describe('Z.Array#at', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = new Z.Array('the', 'quick', 'brown', 'fox');
    });
    describe('given just an index', function() {
      it('should return the value at the given index when given a positive index in range', function() {
        expect(a.at(0)).toBe('the');
        expect(a.at(1)).toBe('quick');
        expect(a.at(2)).toBe('brown');
        return expect(a.at(3)).toBe('fox');
      });
      it('should return the value at the index starting from the end when given a negative index in range', function() {
        expect(a.at(-1)).toBe('fox');
        expect(a.at(-2)).toBe('brown');
        expect(a.at(-3)).toBe('quick');
        return expect(a.at(-4)).toBe('the');
      });
      it('should return null when given a positive index that is out of range', function() {
        expect(a.at(4)).toBeNull();
        return expect(a.at(112)).toBeNull();
      });
      return it('should return null when given a negative index that is out of range', function() {
        expect(a.at(-5)).toBeNull();
        return expect(a.at(-1743)).toBeNull();
      });
    });
    return describe('given an index and a value', function() {
      it('should set the value at the given index', function() {
        expect(a.at(0)).toBe('the');
        a.at(0, 'THE');
        expect(a.at(0)).toBe('THE');
        expect(a.at(-1)).toBe('fox');
        a.at(-1, 'dog');
        return expect(a.at(-1)).toBe('dog');
      });
      return it('should return the value', function() {
        return expect(a.at(1, 'slow')).toBe('slow');
      });
    });
  });

  describe('Z.Array#splice', function() {
    it('should return the receiver', function() {
      var a;
      a = Z.A([1, 2, 3]);
      return expect(a.splice(0, 1, 100)).toBe(a);
    });
    describe('with 1 argument', function() {
      return it('should remove all remaining items starting at the given index', function() {
        expect(Z.A([0, 1, 2]).splice(0).toNative()).toEqual([]);
        expect(Z.A([0, 1, 2]).splice(1).toNative()).toEqual([0]);
        expect(Z.A([0, 1, 2]).splice(2).toNative()).toEqual([0, 1]);
        return expect(Z.A([0, 1, 2]).splice(3).toNative()).toEqual([0, 1, 2]);
      });
    });
    describe('with a positive index in range', function() {
      return it('should replace the given number of items starting at the given index with the given objects', function() {
        expect(Z.A([0, 1, 2]).splice(0, 0).toNative()).toEqual([0, 1, 2]);
        expect(Z.A([0, 1, 2]).splice(0, 1).toNative()).toEqual([1, 2]);
        expect(Z.A([0, 1, 2]).splice(1, 1).toNative()).toEqual([0, 2]);
        expect(Z.A([0, 1, 2]).splice(1, 2).toNative()).toEqual([0]);
        expect(Z.A([0, 1, 2]).splice(1, 20).toNative()).toEqual([0]);
        expect(Z.A([0, 1, 2]).splice(0, 1, 100).toNative()).toEqual([100, 1, 2]);
        expect(Z.A([0, 1, 2]).splice(1, 2, 'a', 'b').toNative()).toEqual([0, 'a', 'b']);
        return expect(Z.A([0, 1, 2]).splice(1, 2, 'a', 'b', 'c', 'd').toNative()).toEqual([0, 'a', 'b', 'c', 'd']);
      });
    });
    describe('with a positive index out of range', function() {
      return it('should grow the length of the array', function() {
        expect(Z.A([0, 1, 2]).splice(4, 0, 'x').toNative()).toEqual([0, 1, 2, void 0, 'x']);
        expect(Z.A([0, 1, 2]).splice(4, 0, 'x', 'y', 'z').toNative()).toEqual([0, 1, 2, void 0, 'x', 'y', 'z']);
        return expect(Z.A([0, 1, 2]).splice(4, 2, 'x', 'y', 'z').toNative()).toEqual([0, 1, 2, void 0, 'x', 'y', 'z']);
      });
    });
    describe('with a negative index in range', function() {
      return it('should replace the given number of items starting at the index from the right with the given objects', function() {
        expect(Z.A([0, 1, 2]).splice(-3, 0).toNative()).toEqual([0, 1, 2]);
        expect(Z.A([0, 1, 2]).splice(-3, 1).toNative()).toEqual([1, 2]);
        expect(Z.A([0, 1, 2]).splice(-2, 1).toNative()).toEqual([0, 2]);
        expect(Z.A([0, 1, 2]).splice(-2, 2).toNative()).toEqual([0]);
        expect(Z.A([0, 1, 2]).splice(-2, 20).toNative()).toEqual([0]);
        expect(Z.A([0, 1, 2]).splice(-3, 1, 100).toNative()).toEqual([100, 1, 2]);
        expect(Z.A([0, 1, 2]).splice(-2, 2, 'a', 'b').toNative()).toEqual([0, 'a', 'b']);
        return expect(Z.A([0, 1, 2]).splice(-2, 2, 'a', 'b', 'c', 'd').toNative()).toEqual([0, 'a', 'b', 'c', 'd']);
      });
    });
    return describe('with a negative index out of range', function() {
      return it('should throw an exception', function() {
        var a;
        a = Z.A([0, 1, 2]);
        return expect(function() {
          return a.splice(-12);
        }).toThrow("Z.Array#splice: index `-12` is too small for " + (a.toString()));
      });
    });
  });

  describe('Z.Array#slice', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = new Z.Array(0, 1, 2, 3, 4, 5);
    });
    describe('given just an index', function() {
      it('should return a new Z.Array with only the items at the given index and after', function() {
        expect(a.slice(0).toNative()).toEqual([0, 1, 2, 3, 4, 5]);
        expect(a.slice(1).toNative()).toEqual([1, 2, 3, 4, 5]);
        expect(a.slice(2).toNative()).toEqual([2, 3, 4, 5]);
        expect(a.slice(-1).toNative()).toEqual([5]);
        expect(a.slice(-2).toNative()).toEqual([4, 5]);
        return expect(a.slice(-3).toNative()).toEqual([3, 4, 5]);
      });
      return it('should return null when given an out of bounds index', function() {
        expect(a.slice(20)).toEqual(null);
        return expect(a.slice(-20)).toEqual(null);
      });
    });
    return describe('given an index and a length', function() {
      it('should return a new Z.Array containing the item at the given index and continuing for n items', function() {
        expect(a.slice(0, 0).toNative()).toEqual([]);
        expect(a.slice(0, 1).toNative()).toEqual([0]);
        expect(a.slice(0, 3).toNative()).toEqual([0, 1, 2]);
        expect(a.slice(2, 2).toNative()).toEqual([2, 3]);
        expect(a.slice(2, 4).toNative()).toEqual([2, 3, 4, 5]);
        expect(a.slice(2, 8).toNative()).toEqual([2, 3, 4, 5]);
        expect(a.slice(-6, 0).toNative()).toEqual([]);
        expect(a.slice(-6, 1).toNative()).toEqual([0]);
        expect(a.slice(-6, 3).toNative()).toEqual([0, 1, 2]);
        expect(a.slice(-4, 2).toNative()).toEqual([2, 3]);
        expect(a.slice(-4, 4).toNative()).toEqual([2, 3, 4, 5]);
        return expect(a.slice(-4, 8).toNative()).toEqual([2, 3, 4, 5]);
      });
      return it('should return null when given an out of bounds index', function() {
        expect(a.slice(20, 2)).toBeNull();
        return expect(a.slice(-20, 2)).toBeNull();
      });
    });
  });

  describe('Z.Array#slice$', function() {
    it('should return null and not mutate the receiver if the given index is out of bounds', function() {
      var a;
      a = new Z.Array(0, 1, 2, 3, 4, 5);
      expect(a.slice$(20)).toBeNull();
      expect(a.toNative()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(a.slice$(-20)).toBeNull();
      return expect(a.toNative()).toEqual([0, 1, 2, 3, 4, 5]);
    });
    return it('should return the same thing as slice, but mutate the receiver in the process', function() {
      var a;
      a = new Z.Array(0, 1, 2, 3, 4, 5);
      expect(a.slice$(0).toNative()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(a.toNative()).toEqual([]);
      a = new Z.Array(0, 1, 2, 3, 4, 5);
      expect(a.slice$(4).toNative()).toEqual([4, 5]);
      expect(a.toNative()).toEqual([0, 1, 2, 3]);
      a = new Z.Array(0, 1, 2, 3, 4, 5);
      expect(a.slice$(2, 2).toNative()).toEqual([2, 3]);
      return expect(a.toNative()).toEqual([0, 1, 4, 5]);
    });
  });

  describe('Z.Array#isEqual', function() {
    it('should return true when the arrays are identical', function() {
      var a;
      a = new Z.Array;
      return expect(a.isEqual(a)).toBe(true);
    });
    it('should return true when the arrays have the same contents', function() {
      var a1, a2;
      a1 = new Z.Array(1, 2, 3);
      a2 = new Z.Array(1, 2, 3);
      return expect(a1.isEqual(a2)).toBe(true);
    });
    it('should return false when given something other than an array', function() {
      expect((new Z.Array).isEqual("foo")).toBe(false);
      expect((new Z.Array).isEqual([])).toBe(false);
      expect((new Z.Array).isEqual({})).toBe(false);
      return expect((new Z.Array).isEqual(new Z.Object)).toBe(false);
    });
    return it('should return false when the array contents differ', function() {
      var a1, a2;
      a1 = new Z.Array(1, 2, 3);
      a2 = new Z.Array(1, 2, 4);
      return expect(a1.isEqual(a2)).toBe(false);
    });
  });

  describe('Z.Array#first', function() {
    it('should return the first object in the array', function() {
      return expect(Z.A([5, 6, 7]).first()).toBe(5);
    });
    return it('should return null when the array is empty', function() {
      return expect(Z.A([]).first()).toBe(null);
    });
  });

  describe('Z.Array#last', function() {
    it('should return the last object in the array', function() {
      return expect(Z.A([5, 6, 7]).last()).toBe(7);
    });
    return it('should return null when the array is empty', function() {
      return expect(Z.A([]).last()).toBe(null);
    });
  });

  describe('Z.Array#push', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = Z.A([1, 2, 3]);
    });
    it('should return the receiver', function() {
      return expect(a.push(4)).toBe(a);
    });
    return it('should append the given object(s) to the end of the array', function() {
      a.push(4);
      expect(a.toNative()).toEqual([1, 2, 3, 4]);
      a.push(10, 11, 12);
      return expect(a.toNative()).toEqual([1, 2, 3, 4, 10, 11, 12]);
    });
  });

  describe('Z.Array.unshift', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = Z.A([1, 2, 3]);
    });
    it('should return the receiver', function() {
      return expect(a.unshift(4)).toBe(a);
    });
    return it('should prepend the given object(s) to the beginning of the array', function() {
      a.unshift(4);
      expect(a.toNative()).toEqual([4, 1, 2, 3]);
      a.unshift(10, 11, 12);
      return expect(a.toNative()).toEqual([10, 11, 12, 4, 1, 2, 3]);
    });
  });

  describe('Z.Array#pop', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = Z.A([1, 2, 3]);
    });
    describe('with no arguments', function() {
      it('should return the last item in the array', function() {
        return expect(a.pop()).toBe(3);
      });
      it('should return null when the array is empty', function() {
        return expect(Z.A([]).pop()).toBe(null);
      });
      return it('should remove the last item from the array', function() {
        a.pop();
        expect(a.toNative()).toEqual([1, 2]);
        a.pop();
        expect(a.toNative()).toEqual([1]);
        a.pop();
        expect(a.toNative()).toEqual([]);
        a.pop();
        return expect(a.toNative()).toEqual([]);
      });
    });
    return describe('with an integer argument', function() {
      it('should return the last n items in a Z.Array', function() {
        expect(Z.A([1, 2, 3]).pop(0).toNative()).toEqual([]);
        expect(Z.A([1, 2, 3]).pop(1).toNative()).toEqual([3]);
        expect(Z.A([1, 2, 3]).pop(2).toNative()).toEqual([2, 3]);
        expect(Z.A([1, 2, 3]).pop(3).toNative()).toEqual([1, 2, 3]);
        return expect(Z.A([1, 2, 3]).pop(4).toNative()).toEqual([1, 2, 3]);
      });
      it('should remove the last n items from the array', function() {
        a = new Z.Array(1, 2, 3, 4, 5, 6, 7);
        a.pop(0);
        expect(a.toNative()).toEqual([1, 2, 3, 4, 5, 6, 7]);
        a.pop(1);
        expect(a.toNative()).toEqual([1, 2, 3, 4, 5, 6]);
        a.pop(2);
        expect(a.toNative()).toEqual([1, 2, 3, 4]);
        a.pop(5);
        return expect(a.toNative()).toEqual([]);
      });
      return it('should throw an exception if given a negative number', function() {
        a = new Z.Array;
        return expect(function() {
          return a.pop(-1);
        }).toThrow("Z.Array#pop: array size must be positive");
      });
    });
  });

  describe('Z.Array#shift', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = Z.A([1, 2, 3]);
    });
    describe('with no arguments', function() {
      it('should return the first item in the array', function() {
        return expect(a.shift()).toBe(1);
      });
      it('should return null when the array is empty', function() {
        return expect(Z.A([]).shift()).toBe(null);
      });
      return it('should remove the first item from the array', function() {
        a.shift();
        expect(a.toNative()).toEqual([2, 3]);
        a.shift();
        expect(a.toNative()).toEqual([3]);
        a.shift();
        expect(a.toNative()).toEqual([]);
        a.shift();
        return expect(a.toNative()).toEqual([]);
      });
    });
    return describe('with an integer arugment', function() {
      it('should return the first n items in a Z.Array', function() {
        expect(Z.A([1, 2, 3]).shift(0).toNative()).toEqual([]);
        expect(Z.A([1, 2, 3]).shift(1).toNative()).toEqual([1]);
        expect(Z.A([1, 2, 3]).shift(2).toNative()).toEqual([1, 2]);
        expect(Z.A([1, 2, 3]).shift(3).toNative()).toEqual([1, 2, 3]);
        return expect(Z.A([1, 2, 3]).shift(4).toNative()).toEqual([1, 2, 3]);
      });
      it('should remove the first n items from the array', function() {
        a = new Z.Array(1, 2, 3, 4, 5, 6, 7);
        a.shift(0);
        expect(a.toNative()).toEqual([1, 2, 3, 4, 5, 6, 7]);
        a.shift(1);
        expect(a.toNative()).toEqual([2, 3, 4, 5, 6, 7]);
        a.shift(2);
        expect(a.toNative()).toEqual([4, 5, 6, 7]);
        a.shift(5);
        return expect(a.toNative()).toEqual([]);
      });
      return it('should throw an exception if given a negative number', function() {
        a = new Z.Array;
        return expect(function() {
          return a.shift(-1);
        }).toThrow("Z.Array#shift: array size must be positive");
      });
    });
  });

  describe('Z.Array#concat', function() {
    var a;
    a = null;
    beforeEach(function() {
      return a = Z.A([1, 2, 3]);
    });
    it('should return a new array containing the contents of the receiver concatenated with the contents of the given array', function() {
      var b;
      b = a.concat(Z.A([4, 5, 6]));
      expect(a.toNative()).toEqual([1, 2, 3]);
      return expect(b.toNative()).toEqual([1, 2, 3, 4, 5, 6]);
    });
    it('should append the argument when given a single non-array argument', function() {
      return expect(a.concat(4).toNative()).toEqual([1, 2, 3, 4]);
    });
    it('should append the contents of the given native array', function() {
      return expect(a.concat([10, 11, 12]).toNative()).toEqual([1, 2, 3, 10, 11, 12]);
    });
    return it('should handle multiple arguments', function() {
      var r;
      r = a.concat(4, [5, 6], Z.A(7, 8, 9), 10, 11);
      return expect(r.toNative()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });
  });

  describe('Z.Array#flatten', function() {
    return it('should return a new array that removes all levels of nested arrays', function() {
      var a;
      a = Z.A([1, 2, [3, 4], Z.A([5, 6, 7]), 8, [9], [[10, 11], 12], [[[[13]]]]]);
      return expect(a.flatten().toNative()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });
  });

  describe('Z.Array KVC collection operators:', function() {
    var Transaction, transactions;
    Transaction = (function() {

      __extends(Transaction, Z.Object);

      function Transaction() {
        Transaction.__super__.constructor.apply(this, arguments);
      }

      Transaction.property('payee');

      Transaction.property('amount');

      Transaction.property('date');

      return Transaction;

    })();
    transactions = null;
    beforeEach(function() {
      return transactions = Z.A([
        new Transaction({
          payee: 'Green Power',
          amount: 120,
          date: new Date(2009, 11, 1)
        }), new Transaction({
          payee: 'Green Power',
          amount: 150,
          date: new Date(2010, 0, 1)
        }), new Transaction({
          payee: 'Green Power',
          amount: 170,
          date: new Date(2010, 1, 1)
        }), new Transaction({
          payee: 'Car Loan',
          amount: 250,
          date: new Date(2010, 0, 15)
        }), new Transaction({
          payee: 'Car Loan',
          amount: 250,
          date: new Date(2010, 1, 15)
        }), new Transaction({
          payee: 'Car Loan',
          amount: 250,
          date: new Date(2010, 2, 15)
        }), new Transaction({
          payee: 'General Cable',
          amount: 120,
          date: new Date(2009, 11, 1)
        }), new Transaction({
          payee: 'General Cable',
          amount: 155,
          date: new Date(2010, 0, 1)
        }), new Transaction({
          payee: 'General Cable',
          amount: 120,
          date: new Date(2010, 2, 1)
        }), new Transaction({
          payee: 'Mortgage',
          amount: 1250,
          date: new Date(2010, 0, 15)
        }), new Transaction({
          payee: 'Mortgage',
          amount: 1250,
          date: new Date(2010, 1, 15)
        }), new Transaction({
          payee: 'Mortgage',
          amount: 1250,
          date: new Date(2010, 2, 15)
        }), new Transaction({
          payee: 'Animal Hospital',
          amount: 600,
          date: new Date(2010, 6, 15)
        })
      ]);
    });
    describe('@count', function() {
      it('should return the number of objects in the left key path', function() {
        return expect(transactions.get('@count')).toBe(13);
      });
      return it('should ignore any keys that appear after the operator', function() {
        return expect(transactions.get('@count.stuff.things')).toBe(13);
      });
    });
    describe('@max', function() {
      it('should return the maximum value from the values of the property specified by the key path to the right of the operator', function() {
        expect(transactions.get('@max.date')).toEqual(new Date(2010, 6, 15));
        return expect(transactions.get('@max.amount')).toBe(1250);
      });
      return it('should handle null values', function() {
        transactions.push(new Transaction({
          payee: 'foo'
        }));
        return expect(function() {
          expect(transactions.get('@max.date')).toEqual(new Date(2010, 6, 15));
          return expect(transactions.get('@max.amount')).toBe(1250);
        }).not.toThrow();
      });
    });
    describe('@min', function() {
      it('should return the minimum value from the values of the property specified by the key path to the right of the operator', function() {
        expect(transactions.get('@min.date')).toEqual(new Date(2009, 11, 1));
        return expect(transactions.get('@min.amount')).toBe(120);
      });
      return it('should handle null values', function() {
        transactions.push(new Transaction({
          payee: 'foo'
        }));
        return expect(function() {
          expect(transactions.get('@min.date')).toEqual(new Date(2009, 11, 1));
          return expect(transactions.get('@min.amount')).toBe(120);
        }).not.toThrow();
      });
    });
    describe('@sum', function() {
      it('should return the sum of the values of the property specified by the key path to the right of the operator', function() {
        return expect(transactions.get('@sum.amount')).toBe(5935);
      });
      return it('should handle null values', function() {
        transactions.push(new Transaction({
          payee: 'foo'
        }));
        return expect(function() {
          return expect(transactions.get('@sum.amount')).toBe(5935);
        }).not.toThrow();
      });
    });
    return describe('@avg', function() {
      it('should return the average of the values of the property specified by the key path to the right', function() {
        var avg;
        avg = parseFloat(transactions.get('@avg.amount').toFixed(2));
        return expect(avg).toBe(456.54);
      });
      return it('should handle null values', function() {
        transactions.push(new Transaction({
          payee: 'foo'
        }));
        return expect(function() {
          var avg;
          avg = parseFloat(transactions.get('@avg.amount').toFixed(2));
          return expect(avg).toBe(423.93);
        }).not.toThrow();
      });
    });
  });

}).call(this);
