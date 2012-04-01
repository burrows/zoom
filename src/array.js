(function(undefined) {

var slice = Array.prototype.slice;

Z.Array = Z.Object.extend(Z.Enumerable, Z.Orderable, function() {
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
      case 'replace':
        if (idx === 0)       { this.willChangeProperty('first'); }
        if (idx === len - 1) { this.willChangeProperty('last'); }
        this.willChangeProperty('@', {
          type     : 'replace',
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
      case 'replace':
        if (idx === 0) { this.didChangeProperty('first'); }
        if (idx === len - 1) { this.didChangeProperty('last'); }
        this.didChangeProperty('@', {
          type    : 'replace',
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

  this.property('size', {
    get: function() { return this.__z_items__.length; },
    set: function(v) { return this.__z_items__.length = v; }
  });

  this.property('first', {
    get: function() { return this.at(0); },
    set: function(v) { return this.at(0, v); }
  });

  this.property('last', {
    get: function() { return this.at(-1); },
    set: function(v) { return this.at(-1, v); }
  });

  this.property('@', { readonly: true, get: function() { return this; } });

  this.def('initialize', function() {
    var arg = arguments[0];

    if (arguments.length > 1) {
      throw new Error(Z.fmt("Z.Array.initialize: wrong number of arguments (%@ for 0 or 1)", arguments.length));
    }

    this.supr();

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
      throw new Error(Z.fmt("Z.Array.initialize: invalid argument (%@), expected a number or array", Z.inspect(arg)));
    }
  });

  this.def('toString', function() {
    if (this.isPrototype) { return this.supr(); }

    return Z.fmt("#<%@:%@ %@>", this.prototypeName(), this.objectId(),
                 Z.inspect(this.__z_items__));
  });

  this.def('toNative', function() { return this.__z_items__; });

  this.def('each', function(f) {
    var items = this.__z_items__, i, len;
    for (i = 0, len = items.length; i < len; i++) { f(items[i], i); }
    return this;
  });

  this.def('join', function(s) {
    return this.__z_items__.join(s);
  });

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

  this.def('index', function(o) {
    var items = this.__z_items__, i, len;

    for (i = 0, len = items.length; i < len; i++) {
      if (Z.eq(items[i], o)) { return i; }
    }

    return null;
  });

  this.def('contains', function(o) { return this.index(o) !== null; });

  this.def('remove', function(o) {
    var items = this.__z_items__, i, len;

    for (len = items.length, i = len - 1; i >= 0; i--) {
      if (Z.eq(items[i], o)) { this.splice(i, 1); }
    }

    return this;
  });

  this.def('splice', function(i, n) {
    var items = slice.call(arguments, 2),
        len   = this.size(),
        idx   = i < 0 ? len + i : i,
        expand, insertIdx, insertNum, removeIdx, removeNum, replaceIdx,
        replaceNum;

    if (idx < 0) {
      throw new Error(Z.fmt("Z.Array.splice: index `%@` is too small for %@", i, this));
    }

    if (n === undefined) { n = len - idx; }

    expand     = idx >= len;
    replaceNum = expand ? 0 : Z.min(n, items.length);
    replaceIdx = idx;
    insertNum  = items.length - replaceNum;
    insertIdx  = idx + replaceNum;
    removeNum  = expand ? 0 : n - replaceNum;
    removeIdx  = idx + replaceNum;

    if (replaceNum > 0) { willMutate.call(this, 'replace', replaceIdx, replaceNum); }
    if (insertNum > 0)  { willMutate.call(this, 'insert', insertIdx, insertNum); }
    if (removeNum > 0)  { willMutate.call(this, 'remove', removeIdx, removeNum); }

    if (expand) { this.__z_items__.length = idx; }

    this.__z_items__.splice.apply(this.__z_items__, [idx, n].concat(items));

    if (replaceNum > 0) { didMutate.call(this, 'replace', replaceIdx, replaceNum); }
    if (insertNum > 0)  { didMutate.call(this, 'insert', insertIdx, insertNum); }
    if (removeNum > 0)  { didMutate.call(this, 'remove', removeIdx, removeNum); }

    return this;
  });

  this.def('clear', function() { return this.splice(0, this.size()); });

  this.def('slice', function(i, n) {
    var len = this.size(), a;

    if (i < 0) { i = len + i; }

    if (i < 0 || i >= len) { return null; }

    if (typeof n === 'undefined') {
      a = this.__z_items__.slice(i);
    }
    else {
      a = this.__z_items__.slice(i, i + n);
    }

    return Z.Array.create(a);
  });

  this.def('slice$', function(i, n) {
    var a = this.slice(i, n);
    if (a === null) { return a; }
    this.splice(i, n);
    return a;
  });

  this.def('eq', function(other) {
    if (!Z.isZObject(other)) { return false; }
    if (!other.isA(Z.Array)) {
      if (!other.respondTo('toArray')) { return false; }
      other = other.toArray();
    }

    return Z.eq(this.__z_items__, other.__z_items__);
  });

  this.def('cmp', function(other) {
    if (!Z.isZObject(other)) { return null; }
    if (!other.isA(Z.Array)) {
      if (!other.respondTo('toArray')) { return null; }
      other = other.toArray();
    }

    return Z.cmp(this.__z_items__, other.__z_items__);
  });

  this.def('hash', function() { return Z.hash(this.__z_items__); });

  this.def('push', function() {
    var args = slice.call(arguments);
    return this.splice.apply(this, [this.size(), 0].concat(args));
  });

  this.def('concat', function() {
    var items = slice.call(arguments), a = [], item, i, len;

    for (i = 0, len = items.length; i < len; i++) {
      item = items[i];
      a.push((item && Z.isA(item, Z.Array)) ? item.__z_items__ : item);
    }

    return Z.A(this.__z_items__.concat.apply(this.__z_items__, a));
  });

  this.def('unshift', function() {
    var items = slice.call(arguments);
    return this.splice.apply(this, [0, 0].concat(items));
  });

  this.def('pop', function(n) {
    var len = this.size();

    if (typeof n !== 'undefined' && n < 0) {
      throw new Error('Z.Array.pop: array size must be positive');
    }

    if (len === 0) { return null; }

    if (typeof n !== 'undefined') {
      if (n > len) { n = len; }
      return this.slice$(-n, n);
    }
    else {
      return this.slice$(-1, 1).at(0);
    }
  });

  this.def('shift', function(n) {
    var len = this.size();

    if (typeof n !== 'undefined' && n < 0) {
      throw new Error('Z.Array.shift: array size must be positive');
    }

    if (len === 0) { return null; }

    if (typeof n !== 'undefined') {
      if (n > len) { n = len; }
      return this.slice$(0, n);
    }
    else {
      return this.slice$(0, 1).at(0);
    }
  });

  this.def('flatten', function() {
    var result = [], item, i, len;

    for (i = 0, len = this.size(); i < len; i++) {
      item = this.at(i);

      if (Z.isA(item, Z.Array)) {
        result = result.concat(item.flatten().__z_items__);
      }
      else if (Z.isArray(item)) {
        result = result.concat(Z.A(item).flatten().__z_items__);
      }
      else {
        result.push(item);
      }
    }

    return Z.A(result);
  });

  this.def('toArray', function() {
    return Z.getPrototypeOf(this) === Z.Array ? this : Z.Array.create(this);
  });

  this.def('sort', function(fn) {
    return Z.Array.create(this.__z_items__.slice().sort(fn || Z.cmp));
  });

  this.def('sort$', function(fn) {
    var size = this.size();

    willMutate.call(this, 'replace', 0, size);
    this.__z_items__.sort(fn || Z.cmp);
    didMutate.call(this, 'replace', 0, size);

    return this;
  });

  this.def('sortBy', function(by) {
    var f = typeof by === 'function' ? by : function(x) { return x.get(by); };

    return this.map(function(x) { return [x, f(x)]; })
      .sort(function(a, b) { return Z.cmp(a[1], b[1]); })
      .map(function(x) { return x[0]; });
  });

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

  this.def('getUnknownProperty', function(k) {
    return this.pluck(k).flatten();
  });
});

// shortcut for instantiating a new array
Z.A = function() {
  var args = slice.call(arguments), len = args.length, first = args[0];

  if (len === 1 && (Z.isArray(first) || Z.isArguments(first))) {
    return Z.Array.create(first);
  }

  return Z.Array.create(args);
};

}());
