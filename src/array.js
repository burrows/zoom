(function(undefined) {

var slice = Array.prototype.slice;

// The `Z.Array` type provides a fully KVC and KVO compliant array
// implementation. In addition to supporting regular properties like `size`,
// `first`, and `last`, `Z.Array` concrete instances also support observing
// mutations made to them and the ability to observe properties on items inside
// the array.
//
// Examples
//
//   // Creating and manipulating arrays
//   var a = Z.Array.create();
//   a.push(1, 2, 3);          // => #<Z.Array:17 [1, 2, 3]>
//   a.unshift(0);             // => #<Z.Array:17 [0, 1, 2, 3]>
//   a.at(4, 4);               // => #<Z.Array:17 [0, 1, 2, 3, 4]>
//   a.at(-2);                 // => 3
//   a.size();                 // => 5
//   a.pop();                  // => 4
//
//   // KVC Support
//   App.Transaction = Z.Object.extend(function() {
//     this.prop('payee'); this.prop('amount');
//   });
//
//   var txns = Z.A(
//     App.Transaction.create({payee: 'Power Co', amount: 120}),
//     App.Transaction.create({payee: 'Car Loan', amount: 250}),
//     App.Transaction.create({payee: 'Cable Co', amount: 50})
//   );
//
//   txns.get('size');  // => 3
//   txns.get('first'); // => #<App.Transaction:48 payee: 'Power Co', amount: 120>
//   txns.get('payee'); // => #<Z.Array:56 ['Power Co', 'Car Loan', 'Cable Co']>
//
//   // KVO Support
//   txns.observe('amount', null, Z.log, {previous: true, current: true});
//   txns.last().amount(60);
//   // {type: 'change', path: 'amount', observee: #<Z.Array:58 [...]>, previous: #<Z.Array:63 [120, 250, 50]>, current: #<Z.Array:68 [120, 250, 60]>}
//
//   // Observing mutations with the @ property
//   txns.observe('@', null, Z.log);
//   txns.pop();
//   // {type: 'remove', path: '@', observee: #<Z.Array:95 [...]>, range: [2, 1]}
Z.Array = Z.Object.extend(Z.Enumerable, Z.Orderable, function() {
  // Internal: Registers item observers on the given items. Item observers are
  // created when an unknown property is observed on an array.
  //
  // items - The items to add observers to.
  //
  // Returns nothing.
  function registerItemObservers(items) {
    var registrations = this.__z_itemRegistrations__, i, j, rlen, ilen, r;

    if (!registrations) { return; }

    for (i = 0, rlen = registrations.length; i < rlen; i++) {
      r = registrations[i];

      for (j = 0, ilen = items.length; j < ilen; j++) {
        items[j].registerObserver(r.tail, r.path, r.observee, r.observer,
                                  r.action, r.opts);
      }
    }
  }

  // Internal: Deregisters item observers on the given items. This method is
  // called when items are removed from an array that has item observers.
  //
  // items - The items to remove observers from.
  //
  // Returns nothing.
  function deregisterItemObservers(items) {
    var registrations = this.__z_itemRegistrations__, i, j, rlen, ilen, r;

    if (!registrations) { return; }

    for (i = 0, rlen = registrations.length; i < rlen; i++) {
      r = registrations[i];

      for (j = 0, ilen = items.length; j < ilen; j++) {
        items[j].deregisterObserver(r.tail, r.path, r.observee, r.observer,
                                    r.action, r.opts);
      }
    }
  }

  // Internal: Called just before a mutation to the array is made, it does the
  // following:
  //
  // * Calls `Z.Object.willChangeProperty` for array properties that will be
  //   affected by the mutation.
  // * Deregisters item observers from items that are about to be removed from
  //   the array.
  // * Prepares notification objects for item observers.
  //
  // type - The type of mutation that will occur (insert, remove, or update).
  // idx  - The index in the array where the mutation will start.
  // n    - The number of items, starting from `idx` that are affected by the
  //        mutation.
  //
  // Returns nothing.
  function willMutate(type, idx, n) {
    var len       = this.size(),
        prevItems = this.slice(idx, n),
        registrations, r, i, notification;

    switch (type) {
      case 'insert':
        this.willChangeProperty('size');
        if (idx === 0)  { this.willChangeProperty('first'); }
        if (idx >= len) { this.willChangeProperty('last'); }
        this.willChangeProperty('@', {
          type     : 'insert',
          range    : [idx, n],
          previous : undefined
        });
        break;
      case 'remove':
        this.willChangeProperty('size');
        if (idx === 0)       { this.willChangeProperty('first'); }
        if (idx + n === len) { this.willChangeProperty('last'); }
        this.willChangeProperty('@', {
          type     : 'remove',
          range    : [idx, n],
          previous : prevItems
        });
        deregisterItemObservers.call(this, prevItems.__z_items__);
        break;
      case 'update':
        if (idx === 0)       { this.willChangeProperty('first'); }
        if (idx === len - 1) { this.willChangeProperty('last'); }
        this.willChangeProperty('@', {
          type     : 'update',
          range    : [idx, n],
          previous : prevItems
        });
        deregisterItemObservers.call(this, prevItems.__z_items__);
        break;
    }

    if (!(registrations = this.__z_itemRegistrations__)) { return; }

    for (i = 0, len = registrations.length; i < len; i++) {
      r = registrations[i];

      if (r.opts.previous) { r.previous = r.observee.get(r.path); }

      if (r.opts.prior) {
        notification = {
          type     : 'change',
          isPrior  : true,
          path     : r.path,
          observee : r.observee
        };

        if (r.opts.context) { notification.context = r.opts.context; }
        if (r.opts.previous) { notification.previous = r.previous; }

        r.callback.call(r.observer, notification);
      }
    }
  }

  // Internal: Called just after a mutation to the array is made, it does the
  // following:
  //
  // * Calls `Z.Object.didChangeProperty` for array properties that were
  //   affected by the mutation.
  // * Registers item observers on items that were added to the array.
  // * Sends notification objects for item observers.
  //
  // type - The type of mutation that just occurred (insert, remove, or
  //        update).
  // idx  - The index in the array where the mutation started.
  // n    - The number of items, starting from `idx` that were affected by the
  //        mutation.
  //
  // Returns nothing.
  function didMutate(type, idx, n) {
    var len      = this.size(),
        curItems = this.slice(idx, n),
        registrations, r, i, notification;

    switch (type) {
      case 'insert':
        this.didChangeProperty('size');
        if (idx === 0)       { this.didChangeProperty('first'); }
        if (idx + n === len) { this.didChangeProperty('last'); }
        this.didChangeProperty('@', {
          type    : 'insert',
          range   : [idx, n],
          current : curItems
        });
        registerItemObservers.call(this, curItems.__z_items__);
        break;
      case 'remove':
        this.didChangeProperty('size');
        if (idx === 0)     { this.didChangeProperty('first'); }
        if (idx + n > len) { this.didChangeProperty('last'); }
        this.didChangeProperty('@', {
          type    : 'remove',
          range   : [idx, n],
          current : undefined
        });
        break;
      case 'update':
        if (idx === 0) { this.didChangeProperty('first'); }
        if (idx === len - 1) { this.didChangeProperty('last'); }
        this.didChangeProperty('@', {
          type    : 'update',
          range   : [idx, n],
          current : curItems
        });
        registerItemObservers.call(this, curItems.__z_items__);
        break;
    }

    if (!(registrations = this.__z_itemRegistrations__)) { return; }

    for (i = 0, len = registrations.length; i < len; i++) {
      r = registrations[i];

      notification = {
        type     : 'change',
        path     : r.path,
        observee : r.observee
      };

      if (r.opts.context)  { notification.context  = r.opts.context; }
      if (r.opts.previous) { notification.previous = r.previous; }
      if (r.opts.current)  { notification.current  = r.observee.get(r.path); }

      r.callback.call(r.observer, notification);
    }
  }

  // Public: A property that returns the current size of the array. The size
  // property can also be set, which simply adjusts the `length` property of the
  // underlying native array.
  this.prop('size', {
    get: function() { return this.__z_items__.length; },
    set: function(v) { return this.__z_items__.length = v; }
  });

  // Public: A property that returns the first item in the array.
  this.prop('first', {
    get: function() { return this.at(0); },
    set: function(v) { return this.at(0, v); }
  });

  // Public: A property that returns the last item in the array.
  this.prop('last', {
    get: function() { return this.at(-1); },
    set: function(v) { return this.at(-1, v); }
  });

  // Public: A special readonly property that only exists for observing array
  // mutations. Observing this property will cause notifications to be sent
  // every time a mutation is made to the array. The `type` key in the
  // notification objects will be set to one of the following: `insert`,
  // `remove`, or `update`. Additionaly, a `range` key will be present that is a
  // tuple containing the starting index of the mutation as well as the number
  // of items that are affected, starting from that index.
  this.prop('@', { readonly: true, get: function() { return this; } });

  // Public: The `Z.Array` constructor. Arrays can be created with zero or one
  // arguments. With zero arguments, an empty array is created. When given an
  // array like object (native array, `Arguments` object, or `Z.Array` instance)
  // the items from the given array are added to the newly created array. If a
  // number is given, an array is created with space allocated for the number of
  // items specified.
  this.def('init', function() {
    var arg = arguments[0];

    if (arguments.length > 1) {
      throw new Error(Z.fmt("Z.Array.init: wrong number of arguments (%@ for 0 or 1)", arguments.length));
    }

    if (arguments.length === 0) {
      this.__z_items__ = [];
    }
    else if (Z.isNumber(arg)) {
      this.__z_items__ = new Array(arg);
    }
    else if (Z.isArray(arg) || Z.isArguments(arg)) {
      this.__z_items__ = slice.apply(arg);
    }
    else if (Z.isA(arg, Z.Array)) {
      this.__z_items__ = arg.__z_items__;
    }
    else {
      throw new Error(Z.fmt("Z.Array.init: invalid argument (%@), expected a number or array", Z.inspect(arg)));
    }
  });

  // Public: Returns a string representation of the array.
  this.def('toString', function() {
    if (this.isType) { return this.supr(); }

    return Z.fmt("#<%@:%@ %@>", this.typeName(), this.objectId(),
                 Z.inspect(this.__z_items__));
  });

  // Public: Returns a native array containing the same items in the receiver.
  this.def('toNative', function() { return this.__z_items__; });

  // Public: The `Z.Array` iterator, invokes the given function once for each
  // item in the array.
  //
  // f - A function object, it will be invoked once for each item in the array.
  //     The first argument will be the the item and the second argument will
  //     be the item's index in the array.
  //
  // Returns the receiver.
  this.def('each', function(f) {
    var items = this.__z_items__, m, i, len;
    f = this.s2f(f);
    for (i = 0, len = items.length; i < len; i++) { f(items[i], i); }
    return this;
  });

  // Public: Returns a string containing the `toString`'d version of each item
  // in the array separated by the given separator string.
  //
  // s - The separator string (default: `','`).
  //
  // Returns a string.
  this.def('join', function(s) { return this.__z_items__.join(s); });

  // Public: Item reference and assignment method. When given one argument,
  // returns the item at the specified index. When passed, two arguments, the
  // second argument is set as the item at the index indicated by the first.
  //
  // Negative indices can be passed to reference items from the end of the array
  // (-1 is the last item in the array).
  //
  // i - A number representing an index in the array.
  // v - A value to set at the given index (optional).
  //
  // Returns the value at the given index when passed one argument. Returns
  //   `null` if the index is out of range.
  // Returns `v` when given two arguments.
  this.def('at', function(i, v) {
    var len = this.size();

    if (i < 0) { i = len + i; }

    if (arguments.length === 1) {
      return (i >= 0 && i < len) ? this.__z_items__[i] : null;
    }
    else {
      this.splice(i, 1, v);
      return v;
    }
  });

  // Public: Returns the index of the given object in the array and `null` if
  // its not present. The presence of the item in the array is determined by
  // comparing each item with the given object using the `Z.eq` method.
  //
  // o - The object to find the index of.
  //
  // Returns the index of the object or `null` if its not present.
  this.def('index', function(o) {
    var items = this.__z_items__, i, len;

    for (i = 0, len = items.length; i < len; i++) {
      if (Z.eq(items[i], o)) { return i; }
    }

    return null;
  });

  // Public: Indicates whether the given object is present in the array.
  //
  // o - The object to check for.
  //
  // Returns `true` if the object is present and `false` otherwise.
  this.def('contains', function(o) { return this.index(o) !== null; });

  // Public: Removes all occurences of the given object from the array.
  //
  // o - The object to remove.
  //
  // Returns the receiver.
  this.def('remove', function(o) {
    var items = this.__z_items__, i, len;

    for (len = items.length, i = len - 1; i >= 0; i--) {
      if (Z.eq(items[i], o)) { this.splice(i, 1); }
    }

    return this;
  });

  // Public: Array mutator. All mutations made to an array (pushing, popping,
  // assignment, etc.) are made through this method. In addition to making the
  // mutation, this method also calls `willMutate` and `didMutate` as
  // appropriate.
  //
  // i      - The index to start the mutation, may be negative.
  // n      - The number of items to remove, starting from `i`. If not
  //          given, then all items starting from `i` are removed.
  // *items - Zero or more items to add to the array, starting at index `i`.
  //
  // Returns the receiver.
  // Throws `Error` when given an index that is out of range.
  this.def('splice', function(i, n) {
    var items = slice.call(arguments, 2),
        len   = this.size(),
        idx   = i < 0 ? len + i : i,
        expand, insertIdx, insertNum, removeIdx, removeNum, updateIdx,
        updateNum;

    if (idx < 0) {
      throw new Error(Z.fmt("Z.Array.splice: index `%@` is too small for %@", i, this));
    }

    if (n === undefined) { n = len - idx; }

    expand    = idx >= len;
    updateNum = expand ? 0 : Z.min(n, items.length);
    updateIdx = idx;
    insertNum = items.length - updateNum;
    insertIdx = idx + updateNum;
    removeNum = expand ? 0 : n - updateNum;
    removeIdx = idx + updateNum;

    if (updateNum > 0) { willMutate.call(this, 'update', updateIdx, updateNum); }
    if (insertNum > 0)  { willMutate.call(this, 'insert', insertIdx, insertNum); }
    if (removeNum > 0)  { willMutate.call(this, 'remove', removeIdx, removeNum); }

    if (expand) { this.__z_items__.length = idx; }

    this.__z_items__.splice.apply(this.__z_items__, [idx, n].concat(items));

    if (updateNum > 0) { didMutate.call(this, 'update', updateIdx, updateNum); }
    if (insertNum > 0) { didMutate.call(this, 'insert', insertIdx, insertNum); }
    if (removeNum > 0) { didMutate.call(this, 'remove', removeIdx, removeNum); }

    return this;
  });

  // Public: Reduces the size of the array to 0 by removing all items.
  //
  // Returns the receiver.
  this.def('clear', function() { return this.splice(0, this.size()); });

  // Public: Builds a new array containing the number of items specified
  // starting from the given index.
  //
  // i - The index to start building the new array from.
  // n - The number of items to copy, starting from `i`. If not specified, all
  //     items until the end of the array are copied.
  //
  // Returns the new array.
  this.def('slice', function(i, n) {
    var len = this.size(), a;

    if (i < 0) { i = len + i; }

    if (i < 0 || i >= len) { return null; }

    if (n === undefined) {
      a = this.__z_items__.slice(i);
    }
    else {
      a = this.__z_items__.slice(i, i + n);
    }

    return Z.Array.create(a);
  });

  // Public: Similar to `Z.Array.slice`, but deletes the items added to the new
  // array from the receiver.
  //
  // i - The index to start building the new array from.
  // n - The number of items to copy, starting from `i`. If not specified, all
  //     items until the end of the array are copied.
  //
  // Returns the new array.
  this.def('slice$', function(i, n) {
    var a = this.slice(i, n);
    if (a === null) { return a; }
    this.splice(i, n);
    return a;
  });

  // Public: `Z.Array` equality test, performs an item-wise comparison between
  // the receiver and the given array. If the given object is not a `Z.Array`,
  // then this method attempts to convert it to a `Z.Array` by invoking its
  // `toArray` method if it exists.
  //
  // other - A `Z.Array` to compare to the receiver.
  //
  // Returns `true` if the arrays are equal and `false` otherwise.
  this.def('eq', function(other) {
    if (!Z.isZObject(other)) { return false; }
    if (!other.isA(Z.Array)) {
      if (!other.respondTo('toArray')) { return false; }
      other = other.toArray();
    }

    return Z.eq(this.__z_items__, other.__z_items__);
  });

  // Public: Array comparison. Returns `-1` if the receiver is less than the
  // argument, `0` if they are equal, and `1` if the receiver is greater than
  // the argument. If the given object is not a `Z.Array`, then this method
  // attempts to convert to one by invoking its `toArray` method if it exists.
  //
  // other - A `Z.Array` to compare to the receiver.
  //
  // Returns `null` if `other` is not a `Z.Array` and can't be converted to one.
  this.def('cmp', function(other) {
    if (!Z.isZObject(other)) { return null; }
    if (!other.isA(Z.Array)) {
      if (!other.respondTo('toArray')) { return null; }
      other = other.toArray();
    }

    return Z.cmp(this.__z_items__, other.__z_items__);
  });

  // Public: Generates a hash value for the array.
  this.def('hash', function() {
    return this.isType ? this.supr() : Z.hash(this.__z_items__);
  });

  // Public: Pushes one ore more items on to the end of the array.
  //
  // *items - One or more objects to add to the end of the array.
  //
  // Returns the receiver.
  this.def('push', function() {
    var args = slice.call(arguments);
    return this.splice.apply(this, [this.size(), 0].concat(args));
  });

  // Public: Returns a new array comprised of the items in the receiver and the
  // items in the given arrays.
  //
  // *items - One or more objects to add to the new array. If a `Z.Array` object
  //          is given, its items are copied to the new array. If an item is not
  //          a `Z.Array`, is copied directly into the new array.
  //
  // Returns a new `Z.Array` instance.
  this.def('concat', function() {
    var items = slice.call(arguments), a = [], item, i, len;

    for (i = 0, len = items.length; i < len; i++) {
      item = items[i];
      a.push((item && Z.isA(item, Z.Array)) ? item.__z_items__ : item);
    }

    return Z.Array.create(this.__z_items__.concat.apply(this.__z_items__, a));
  });

  // Public: Unshifts the given items to the beginning of the array.
  //
  // *items - One or more objects to add to the beginning of the array.
  //
  // Returns the receiver.
  this.def('unshift', function() {
    var items = slice.call(arguments);
    return this.splice.apply(this, [0, 0].concat(items));
  });

  // Public: Pops one or more items off the end of the array and returns them.
  //
  // n - The number of items to pop off the array (default: `1`).
  //
  // Returns the last item in the array when `n` is `1`.
  // Returns a `Z.Array` containing all items popped when `n` is greater than
  //   `1`.
  // Throws `Error` if `n` is negative.
  this.def('pop', function(n) {
    var len = this.size();

    if (n !== undefined && n < 0) {
      throw new Error('Z.Array.pop: array size must be positive');
    }

    if (len === 0) { return null; }

    if (n !== undefined) {
      if (n > len) { n = len; }
      return this.slice$(-n, n);
    }
    else {
      return this.slice$(-1, 1).at(0);
    }
  });

  // Public: Shifts one ore more items off the beginning of the array and
  // returns them.
  //
  // n - The number of items to unshift off the array (default: `1`).
  //
  // Returns the first item in the array when `n` is `1`.
  // Returns a `Z.Array` containing all items unshifted when `n` is greater than
  //   `1`.
  // Throws `Error` if `n` is negative.
  this.def('shift', function(n) {
    var len = this.size();

    if (n !== undefined && n < 0) {
      throw new Error('Z.Array.shift: array size must be positive');
    }

    if (len === 0) { return null; }

    if (n !== undefined) {
      if (n > len) { n = len; }
      return this.slice$(0, n);
    }
    else {
      return this.slice$(0, 1).at(0);
    }
  });

  // Public: Builds a new array that is the one-dimensional flattening of the
  // receiver. In other words, for every item that is itself an array, its items
  // are added to the new array.
  //
  // Returns a new `Z.Array` instance.
  this.def('flatten', function() {
    var result = [], item, i, len;

    for (i = 0, len = this.size(); i < len; i++) {
      item = this.at(i);

      if (Z.isA(item, Z.Array)) {
        result = result.concat(item.flatten().__z_items__);
      }
      else if (Z.isArray(item)) {
        result = result.concat(Z.Array.create(item).flatten().__z_items__);
      }
      else {
        result.push(item);
      }
    }

    return Z.Array.create(result);
  });

  // Public: Returns the receiver if it is a direct instance of `Z.Array`. If
  // the receiver is an instance of a sub-type of `Z.Array` it is converted to
  // a `Z.Array` instance.
  //
  // Returns a `Z.Array`.
  this.def('toArray', function() {
    return Z.getPrototypeOf(this) === Z.Array ? this : Z.Array.create(this);
  });

  // Public: Returns a new `Z.Array` containing the sorted items of the
  // receiver, as determined by the given comparison function.
  //
  // If the comparison function used to perform the sort is non-trivial, it may
  // be more performant to use the `sortBy` method, which performs a
  // [Schwartzian transform](http://en.wikipedia.org/wiki/Schwartzian_transform).
  //
  // fn - The comparison function to use (default: `Z.cmp`).
  //
  // Returns a `Z.Array`.
  this.def('sort', function(fn) {
    return Z.Array.create(this.__z_items__.slice().sort(fn || Z.cmp));
  });

  // Public: Sorts the receiver in place.
  //
  // fn - The comparison function to use (default: `Z.cmp`).
  //
  // Returns the receiver.
  this.def('sort$', function(fn) {
    var size = this.size();

    if (size > 0) {
      willMutate.call(this, 'update', 0, size);
      this.__z_items__.sort(fn || Z.cmp);
      didMutate.call(this, 'update', 0, size);
    }

    return this;
  });

  // Public: Returns a new `Z.Array` instance that contains all items in the
  // receiver.
  //
  // Returns a `Z.Array`.
  this.def('dup', function() { return Z.Array.create(this.__z_items__); });

  // Public: Returns a new `Z.Array` instance containing only the unique items
  // in the receiver.
  //
  // Returns a `Z.Array`.
  this.def('uniq', function() {
    var a = this.dup();
    a.uniq$();
    return a;
  });

  // Public: Removes duplicate items from the receiver.
  //
  // Returns the receiver if duplicates where found and `nil` if no changes were
  //   made.
  this.def('uniq$', function() {
    var h = Z.H(), items = this.__z_items__, remove = [], i, len;

    for (i = 0, len = items.length; i < len; i++) {
      if (h.hasKey(items[i])) { remove.push(i); }
      else { h.at(items[i], true); }
    }

    for (i = remove.length - 1; i >= 0; i--) {
      this.splice(remove[i], 1);
    }

    return remove.length > 0 ? this : null;
  });

  // Public: Sorts the receiver by the given property path or comparison
  // function. This method uses a [Schwartzian transform](http://en.wikipedia.org/wiki/Schwartzian_transform)
  // in order to avoid calculating the sort property of each item more than
  // once. The `sort` method does not use a Schwartzian transform, so use this
  // method when sorting by a complex or expensive to calculate property and
  // `sort` when sorting by a simple property.
  //
  // by - Either a string containing a property path or a comparison function.
  //
  // Returns a `Z.Array`.
  this.def('sortBy', function(by) {
    var f = typeof by === 'function' ? by : function(x) { return x.get(by); };

    return this.map(function(x) { return [x, f(x)]; })
      .sort(function(a, b) { return Z.cmp(a[1], b[1]); })
      .map(function(x) { return x[0]; });
  });

  // Internal: Overrides the default `registerObserver` implemention in
  // `Z.Object` in order to proxy observers on unknown properties to each item
  // in the array.
  this.def('registerObserver', function(rpath, opath, observee, observer, action, opts) {
    var items = this.__z_items__, registration, i, len;

    if (this.hasProperty(rpath[0])) {
      return this.supr(rpath, opath, observee, observer, action, opts);
    }

    registration = {
      path     : opath,
      head     : null,
      tail     : rpath,
      observee : observee,
      observer : observer,
      action   : action,
      callback : typeof action === 'function' ? action : observer[action],
      opts     : opts,
      previous : null
    };

    this.__z_itemRegistrations__ = this.__z_itemRegistrations__ || [];
    this.__z_itemRegistrations__.push(registration);

    for (i = 0, len = items.length; i < len; i++) {
      items[i].registerObserver(rpath, opath, observee, observer, action, opts);
    }

    return registration;
  });

  // Internal: Overrides the default `deregisterObserver` implemention in
  // `Z.Object` in order to remove item observers.
  this.def('deregisterObserver', function(rpath, opath, observee, observer, action, opts) {
    var items = this.__z_items__, registrations, r, i, j, rlen, ilen;

    if (this.hasProperty(rpath[0])) {
      return this.supr.apply(this, slice.call(arguments));
    }

    if (!(registrations = this.__z_itemRegistrations__)) { return; }

    for (i = 0, rlen = registrations.length; i < rlen; i++) {
      r = registrations[i];

      if (r.path     === opath    &&
          r.observee === observee &&
          r.observer === observer &&
          r.action   === action) {
        registrations.splice(i, 1);

        for (j = 0, ilen = items.length; j < ilen; j++) {
          items[j].deregisterObserver(rpath, opath, observee, observer, action, opts);
        }

        return;
      }
    }
  });

  // Internal: Proxies gets for unknown properties out to all items and returns
  // a new array containing each value. The resulting array is flattened.
  //
  // k - The name of the property to get from each item.
  //
  // Returns a `Z.Array` containing the values obtained by getting the given
  //   property from each item in the array.
  this.def('getUnknownProperty', function(k) {
    return this.pluck(k).flatten();
  });

  // Internal: Proxies sets for unknown properties out to all items in the
  // array.
  //
  // k - The name of the property to set from each item.
  // v - The value to set on each item.
  //
  // Returns nothing.
  this.def('setUnknownProperty', function(k, v) {
    this.each(function(item) { item.set(k, v); });
  });
});

// Public: A shortcut for constructing `Z.Array` concrete instances from a list
// of arguments.
//
// *args - Zero or more objects to add to the new array.
//
// Returns a new `Z.Array` concrete instance.
Z.A = function() { return Z.Array.create(slice.call(arguments)); };

}());
