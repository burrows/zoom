(function() {

if (!this.Z) { require('./helper'); }

var Person, p1, p2, p3, p4;

Person = Z.Object.extend(function() {
  this.prop('first');
  this.prop('last');
});

p1 = Person.create({first: 'Theon', last: 'Greyjoy'});
p2 = Person.create({first: 'Davos', last: 'Seaworth'});
p3 = Person.create({first: 'Meera', last: 'Reed'});
p4 = Person.create({first: 'Doran', last: 'Martell'});

Person = Z.Object.extend(function() {
  this.prop('first');
  this.prop('last');
});

function nameAsc(a, b) {
  var afull = a.last() + ', ' + a.first(),
      bfull = b.last() + ', ' + b.first();
  return Z.cmp(afull, bfull);
}

function nameDesc(a, b) {
  var afull = a.last() + ', ' + a.first(),
      bfull = b.last() + ', ' + b.first();
  return Z.cmp(bfull, afull);
}

function evenLast(p) {  return p.last().length % 2 === 0; }

describe('Z.ArrayController', function() {
  var controller;

  beforeEach(function() {
    controller = Z.ArrayController.create({content: Z.A(p1, p2, p3, p4)});
  });

  describe('.arranged', function() {
    describe('with no `compareFn` or `filterFn`', function() {
      it('should return an empty array when `content` is `null`', function() {
        expect(Z.ArrayController.create().arranged()).toEq(Z.A());
      });

      it('should return an array the same as `content`', function() {
        expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4));
      });

      it('should append items added to `content` to the end of the array', function() {
        var p5 = Person.create({first: 'Steve', last: 'Jobs'}),
            p6 = Person.create({first: 'Steve', last: 'Wozniak'});

        controller.content().push(p5);
        expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4, p5));
        controller.content().unshift(p6);
        expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4, p5, p6));
      });

      it('should remove items that are removed from `content`', function() {
        controller.content().pop();
        expect(controller.arranged()).toEq(Z.A(p1, p2, p3));
        controller.content().shift();
        expect(controller.arranged()).toEq(Z.A(p2, p3));
      });

      it('should remove replaced items from `content` and append the replacements', function() {
        var p5 = Person.create({first: 'Steve', last: 'Jobs'});
        controller.content().at(1, p5);
        expect(controller.arranged()).toEq(Z.A(p1, p3, p4, p5));
        controller.content().splice(1, 2, p2);
        expect(controller.arranged()).toEq(Z.A(p1, p4, p2));
      });

      it('should update when `content` is changed', function() {
        controller.content(Z.A(p2, p4));
        expect(controller.arranged()).toEq(Z.A(p2, p4));
      });
    });

    describe('with a `compareFn`', function() {
      beforeEach(function() {  controller.compareFn(nameAsc); });

      it('should return the sorted `content` array', function() {
        expect(controller.arranged()).toEq(Z.A(p1, p4, p3, p2));
      });

      it('should maintain sorted order when content items are added', function() {
        var p5 = Person.create({first: 'Petyr', last: 'Baelish'}),
            p6 = Person.create({first: 'Tywin', last: 'Lannister'});

        controller.content().push(p5);
        expect(controller.arranged()).toEq(Z.A(p5, p1, p4, p3, p2));
        controller.content().splice(1, 0, p6);
        expect(controller.arranged()).toEq(Z.A(p5, p1, p6, p4, p3, p2));
      });

      it('should maintain sorted order when content items are removed', function() {
        controller.content().pop(2);
        expect(controller.arranged()).toEq(Z.A(p1, p2));
      });

      it('should maintain sorted order when content items are replaced', function() {
        var p5 = Person.create({first: 'Petyr', last: 'Baelish'});

        controller.content().at(2, p5);
        expect(controller.arranged()).toEq(Z.A(p5, p1, p4, p2));
      });

      it('should sort the content array when it is changed', function() {
        controller.content(Z.A(p2, p3, p4));
        expect(controller.arranged()).toEq(Z.A(p4, p3, p2));
      });
    });

    describe('with a `filterFn`', function() {
      beforeEach(function() { controller.filterFn(evenLast); });

      it('should return the filtered `content` array', function() {
        expect(controller.arranged()).toEq(Z.A(p2, p3));
      });

      it('should not insert added content item that do not match the filter', function() {
        var p5 = Person.create({first: 'Bran', last: 'Stark'});
        controller.content().push(p5);
        expect(controller.arranged()).toEq(Z.A(p2, p3));
      });

      it('should append added content items that do match the filter', function() {
        var p5 = Person.create({first: 'Mace', last: 'Tyrell'});
        controller.content().push(p5);
        expect(controller.arranged()).toEq(Z.A(p2, p3, p5));
      });

      it('should remove removed content items', function() {
        controller.content().remove(p2);
        expect(controller.arranged()).toEq(Z.A(p3));
      });

      it('should handle replaced content items', function() {
        var p5 = Person.create({first: 'Mace', last: 'Tyrell'}),
            p6 = Person.create({first: 'Margaery', last: 'Tyrell'});

        controller.content().at(0, p5);
        expect(controller.arranged()).toEq(Z.A(p2, p3, p5));
        controller.content().at(1, p6);
        expect(controller.arranged()).toEq(Z.A(p3, p5, p6));
      });

      it('should filter the content array when it is changed', function() {
        controller.content(Z.A(p1, p2));
        expect(controller.arranged()).toEq(Z.A(p2));
      });
    });

    describe('with both a `compareFn` and `filterFn`', function() {
      beforeEach(function() {
        controller.compareFn(nameAsc);

        controller.filterFn(function(o) {
          return o.last().length % 2 === 0;
        });
      });

      it('should return the sorted and filtered `content` array', function() {
        expect(controller.arranged()).toEq(Z.A(p3, p2));
      });

      it('should insert added content items that match the filter into sorted order', function() {
        var p5 = Person.create({first: 'Rodrik', last: 'Cassel'});
        controller.content().push(p5);
        expect(controller.arranged()).toEq(Z.A(p5, p3, p2));
      });

      it('should not insert added content items that do not match the filter', function() {
        var p5 = Person.create({first: 'Bran', last: 'Stark'});
        controller.content().push(p5);
        expect(controller.arranged()).toEq(Z.A(p3, p2));
      });
    });
  });

  describe('single selection', function() {
    beforeEach(function() {
      controller.allowsMultipleSelection(false);
    });

    describe('.selectItem', function() {
      it('should add the item to the `selection` array', function() {
        expect(controller.selection()).toEq(Z.A());
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p2));
      });

      it('should replace the currently selected item in the `selection` array', function() {
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p2));
        controller.selectItem(p3);
        expect(controller.selection()).toEq(Z.A(p3));
      });

      it('should add the `arranged` index of the item to the `selectionIndexes` array', function() {
        controller.selectItem(p2);
        expect(controller.selectionIndexes()).toEq(Z.A(1));
        controller.selectItem(p4);
        expect(controller.selectionIndexes()).toEq(Z.A(3));
      });

      it('should add the `arranged` index of the item to the `selectionIndexes` array when the arranged index is different than the content index', function() {
        controller.compareFn(nameAsc);
        controller.selectItem(p4);
        expect(controller.selectionIndexes()).toEq(Z.A(1));
        controller.selectItem(p2);
        expect(controller.selectionIndexes()).toEq(Z.A(3));
      });

      it('should not add the `arranged` index to the `selectionIndexes` array when the item does not appear in `arranged`', function() {
        controller.filterFn(evenLast);
        controller.selectItem(p1);
        expect(controller.selectionIndexes()).toEq(Z.A());
      });

      it('should not add an item to `selection` array multiple times', function() {
        controller.selectItem(p2);
        controller.selectItem(p2);
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p2));
      });

      it('should not add an index to `selectionIndexes` multiple times', function() {
        controller.selectItem(p3);
        controller.selectItem(p3);
        controller.selectItem(p3);
        expect(controller.selectionIndexes()).toEq(Z.A(2));
      });
    });

    describe('.unselectItem', function() {
      it('should do nothing if the item is not already selected', function() {
        expect(controller.selection()).toEq(Z.A());
        controller.unselectItem(p1);
        expect(controller.selection()).toEq(Z.A());
      });

      it('should remove the item from the `selection` array', function() {
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p2));
        controller.unselectItem(p2);
        expect(controller.selection()).toEq(Z.A());
      });

      it("should remove the item's `arranged` index from the array", function() {
        controller.selectItem(p2);
        expect(controller.selectionIndexes()).toEq(Z.A(1));
        controller.unselectItem(p2);
        expect(controller.selectionIndexes()).toEq(Z.A());
      });
    });
  });

  describe('multiple selection', function() {
    beforeEach(function() {
      controller.allowsMultipleSelection(true);
    });

    describe('.selectItem', function() {
      it('should add the item to the `selection` array', function() {
        expect(controller.selection()).toEq(Z.A());
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p2));
      });

      it('should add multiple items to the `selection` array', function() {
        controller.selectItem(p2);
        controller.selectItem(p3);
        expect(controller.selection()).toEq(Z.A(p2, p3));
      });

      it('should not add an item to the `selection` array multiple times', function() {
        controller.selectItem(p2);
        controller.selectItem(p2);
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p2));
      });

      it('should add the `arranged` indexes of the selected items to the `selectionIndexes` array', function() {
        controller.selectItem(p1);
        controller.selectItem(p3);
        expect(controller.selectionIndexes()).toEq(Z.A(0, 2));
      });

      it('should not add the arranged index to the `selectionIndexes` array multiple times', function() {
        controller.selectItem(p1);
        controller.selectItem(p1);
        controller.selectItem(p1);
        expect(controller.selectionIndexes()).toEq(Z.A(0));
      });

      it('should add the `arranged` index of the item to the `selectionIndexes` array when the arranged index is different than the content index', function() {
        controller.compareFn(nameAsc);
        controller.selectItem(p4);
        controller.selectItem(p2);
        expect(controller.selectionIndexes()).toEq(Z.A(1, 3));
      });

      it('should not add the `arranged` index to the `selectionIndexes` array when the item does not appear in `arranged`', function() {
        controller.filterFn(evenLast);
        controller.selectItem(p1);
        expect(controller.selectionIndexes()).toEq(Z.A());
      });
    });

    describe('.unselectItem', function() {
      it('should do nothing if the item is not already selected', function() {
        expect(controller.selection()).toEq(Z.A());
        controller.unselectItem(p1);
        expect(controller.selection()).toEq(Z.A());
      });

      it('should remove the item from the `selection` array', function() {
        controller.selectItem(p2);
        controller.selectItem(p4);
        expect(controller.selection()).toEq(Z.A(p2, p4));
        controller.unselectItem(p2);
        expect(controller.selection()).toEq(Z.A(p4));
        controller.unselectItem(p4);
        expect(controller.selection()).toEq(Z.A());
      });

      it("should remove the item's `arranged` index from the array", function() {
        controller.selectItem(p2);
        controller.selectItem(p4);
        expect(controller.selectionIndexes()).toEq(Z.A(1, 3));
        controller.unselectItem(p2);
        expect(controller.selectionIndexes()).toEq(Z.A(3));
        controller.unselectItem(p4);
        expect(controller.selectionIndexes()).toEq(Z.A());
      });
    });

    describe('.clearSelection', function() {
      it('should clear the `selection` and `selectionIndexes` arrays', function() {
        controller.selectItem(p1);
        controller.selectItem(p2);
        expect(controller.selection()).toEq(Z.A(p1, p2));
        expect(controller.selectionIndexes()).toEq(Z.A(0, 1));
        controller.clearSelection();
        expect(controller.selection()).toEq(Z.A());
        expect(controller.selectionIndexes()).toEq(Z.A());
      });
    });
  });

  describe('changing `compareFn`', function() {
    it('should rearrange the `arranged` array', function() {
      expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4));
      controller.compareFn(nameAsc);
      expect(controller.arranged()).toEq(Z.A(p1, p4, p3, p2));
      controller.compareFn(nameDesc);
      expect(controller.arranged()).toEq(Z.A(p2, p3, p4, p1));
      controller.compareFn(null);
      expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4));
    });
  });

  describe('changing `filterFn`', function() {
    it('should update the `arranged` array', function() {
      expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4));
      controller.filterFn(evenLast);
      expect(controller.arranged()).toEq(Z.A(p2, p3));
      controller.filterFn(null);
      expect(controller.arranged()).toEq(Z.A(p1, p2, p3, p4));
    });

    it('should update the `selectionIndexes` array', function() {
      controller.allowsMultipleSelection(true);
      controller.selectItem(p1);
      controller.selectItem(p2);
      expect(controller.selectionIndexes()).toEq(Z.A(0, 1));
      controller.filterFn(evenLast);
      expect(controller.selectionIndexes()).toEq(Z.A(0));
      controller.filterFn(null);
      expect(controller.selectionIndexes()).toEq(Z.A(0, 1));
    });
  });

  describe('changing `content`', function() {
    it('should clear the `selection` array', function() {
      controller.allowsMultipleSelection(true);
      controller.selectItem(p1);
      controller.selectItem(p3);
      expect(controller.selection()).toEq(Z.A(p1, p3));
      controller.content(Z.A(p1, p4));
      expect(controller.selection()).toEq(Z.A());
    });

    it('should clear the `selectionIndexes` array', function() {
      controller.allowsMultipleSelection(true);
      controller.selectItem(p1);
      controller.selectItem(p3);
      expect(controller.selectionIndexes()).toEq(Z.A(0, 2));
      controller.content(Z.A(p1, p4));
      expect(controller.selectionIndexes()).toEq(Z.A());
    });
  });
});

}());
