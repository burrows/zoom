(function(undefined) {

var slice = Array.prototype.slice;

Z.Array = Z.Object.extend(Z.Enumerable, function() {
  this.isZArray = true;

  this.property('length', {
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

  this.property('@', {
    readonly: true,
    get: function() { return this; }
  });

  this.def('initialize', function() {
    var arg = arguments[0];

    if (arguments.length > 1) {
      throw new Error(Z.fmt("Z.Array.initialize: wrong number of arguments (%@ for 0 or 1)", arguments.length));
    }

    this.supr();

    if (arguments.length === 0) {
      this.__z_items__ = [];
    }
    else if (typeof arg === 'number') {
      this.__z_items__ = new Array(arg);
    }
    else if (Z.isArray(arg)) {
      this.__z_items__ = arg.slice();
    }
    else if (arg && arg.isZArray) {
      this.__z_items__ = arg.toNative();
    }
    else {
      throw new Error(Z.fmt("Z.Array.initialize: invalid argument (%@), expected a number or array", arg));
    }
  });

  this.def('toString', function() {
    var a = this.map(function(item) {
      return Z.inspect(item);
    }).join(', ');

    return Z.fmt("#<%@:%@ [%@]>", this.prototypeName(), this.objectId(), a);
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
    var len = this.length();
    
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

  this.def('remove', function(o) {
    var items = this.__z_items__, i, len;

    for (len = items.length, i = len - 1; i >= 0; i--) {
      if (Z.eq(items[i], o)) { this.splice(i, 1); }
    }

    return this;
  });

  this.def('splice', function(i, n) {
    var items = slice.call(arguments, 2),
        len   = this.length(),
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

    if (replaceNum > 0) { willMutate(this, 'replace', replaceIdx, replaceNum); }
    if (insertNum > 0)  { willMutate(this, 'insert', insertIdx, insertNum); }
    if (removeNum > 0)  { willMutate(this, 'remove', removeIdx, removeNum); }

    if (expand) { this.__z_items__.length = idx; }

    this.__z_items__.splice.apply(this.__z_items__, [idx, n].concat(items));

    if (replaceNum > 0) { didMutate(this, 'replace', replaceIdx, replaceNum); }
    if (insertNum > 0)  { didMutate(this, 'insert', insertIdx, insertNum); }
    if (removeNum > 0)  { didMutate(this, 'remove', removeIdx, removeNum); }

    return this;
  });

  this.def('slice', function(i, n) {
    var len = this.length(), a;

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
    var len = this.length();

    if (!other || !other.isZArray) { return false; }
    if (len !== other.length()) { return false; }

    for (i = 0; i < len; i++) {
      if (!Z.eq(this.at(i), other.at(i))) { return false; }
    }

    return true;
  });

  this.def('hash', function() {
    return Z.hash(this.toNative());
  });

  this.def('push', function() {
    var args = slice.call(arguments);
    return this.splice.apply(this, [this.length(), 0].concat(args));
  });

  this.def('concat', function() {
    var items = slice.call(arguments), a = [], item, i, len;

    for (i = 0, len = items.length; i < len; i++) {
      item = items[i];
      a.push((item && item.isZArray) ? item.__z_items__ : item);
    }

    return Z.A(this.__z_items__.concat.apply(this.__z_items__, a));
  });

  this.def('unshift', function() {
    var items = slice.call(arguments);
    return this.splice.apply(this, [0, 0].concat(items));
  });

  this.def('pop', function(n) {
    var len = this.length();

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
    var len = this.length();

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

    for (i = 0, len = this.length(); i < len; i++) {
      item = this.at(i);

      if (item && item.isZArray) {
        result = result.concat(item.flatten().toNative());
      }
      else if (Z.isArray(item)) {
        result = result.concat(Z.A(item).flatten().toNative());
      }
      else {
        result.push(item);
      }
    }

    return Z.A(result);
  });

  this.def('registerObserver', function(rpath, opath, observee, observer, action, opts) {
    var items = this.toNative(), registration, i, len;

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

  this.def('deregisterObserver', function(rpath, opath, observee, observer, action) {
    var items = this.toNative(), registrations, r, i, j, rlen, ilen;

    if (this.hasProperty(rpath[0])) {
      return this.supr(rpath, opath, observee, observer, action);
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
          items[j].deregisterObserver(rpath, opath, observee, observer, action);
        }

        return;
      }
    }
  });

  this.def('_get', function(path) {
    var head = path[0], tail = path.slice(1);

    switch (head) {
      case '@count':
        return this.length();
      case '@max':
        return this._get(tail).inject(function(acc, item) {
          return Z.max(acc, item);
        });
      case '@min':
        return this._get(tail).inject(function(acc, item) {
          return Z.min(acc, item);
        });
      case '@sum':
        return this._get(tail).inject(function(acc, item) {
          return acc + item;
        });
      case '@avg':
        return this._get(['@sum'].concat(tail)) / this.length();
      default:
        return this.supr(path);
    }
  });

  this.def('getUnknownProperty', function(k) {
    return this.pluck(k).flatten();
  });

  function willMutate(array, type, idx, n) {
    var len       = array.length(),
        prevItems = array.slice(idx, n),
        registrations, r, i, notification;

    switch (type) {
      case 'insert':
        array.willChangeProperty('length');
        if (idx === 0)  { array.willChangeProperty('first'); }
        if (idx >= len) { array.willChangeProperty('last'); }
        array.willChangeProperty('@', {
          type     : 'insert',
          range    : [idx, n],
          previous : undefined
        });
        break;
      case 'remove':
        array.willChangeProperty('length');
        if (idx === 0)       { array.willChangeProperty('first'); }
        if (idx + n === len) { array.willChangeProperty('last'); }
        array.willChangeProperty('@', {
          type     : 'remove',
          range    : [idx, n],
          previous : prevItems
        });
        deregisterItemObservers(array, prevItems.toNative());
        break;
      case 'replace':
        if (idx === 0)       { array.willChangeProperty('first'); }
        if (idx === len - 1) { array.willChangeProperty('last'); }
        array.willChangeProperty('@', {
          type     : 'replace',
          range    : [idx, n],
          previous : prevItems
        });
        deregisterItemObservers(array, prevItems.toNative());
        break;
    }

    if (!(registrations = array.__z_itemRegistrations__)) { return; }

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

  function didMutate(array, type, idx, n) {
    var len      = array.length(),
        curItems = array.slice(idx, n),
        registrations, r, i, notification;

    switch (type) {
      case 'insert':
        array.didChangeProperty('length');
        if (idx === 0)       { array.didChangeProperty('first'); }
        if (idx + n === len) { array.didChangeProperty('last'); }
        array.didChangeProperty('@', {
          type    : 'insert',
          range   : [idx, n],
          current : curItems
        });
        registerItemObservers(array, curItems.toNative());
        break;
      case 'remove':
        array.didChangeProperty('length');
        if (idx === 0)     { array.didChangeProperty('first'); }
        if (idx + n > len) { array.didChangeProperty('last'); }
        array.didChangeProperty('@', {
          type    : 'remove',
          range   : [idx, n],
          current : undefined
        });
        break;
      case 'replace':
        if (idx === 0) { array.didChangeProperty('first'); }
        if (idx === len - 1) { array.didChangeProperty('last'); }
        array.didChangeProperty('@', {
          type    : 'replace',
          range   : [idx, n],
          current : curItems
        });
        registerItemObservers(array, curItems.toNative());
        break;
    }

    if (!(registrations = array.__z_itemRegistrations__)) { return; }

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

  function registerItemObservers(array, items) {
    var registrations = array.__z_itemRegistrations__, i, j, rlen, ilen, r;

    if (!registrations) { return; }

    for (i = 0, rlen = registrations.length; i < rlen; i++) {
      r = registrations[i];

      for (j = 0, ilen = items.length; j < ilen; j++) {
        items[j].registerObserver(r.tail, r.path, r.observee, r.observer,
                                  r.action, r.opts);
      }
    }
  }

  function deregisterItemObservers(array, items) {
    var registrations = array.__z_itemRegistrations__, i, j, rlen, ilen, r;

    if (!registrations) { return; }

    for (i = 0, rlen = registrations.length; i < rlen; i++) {
      r = registrations[i];

      for (j = 0, ilen = items.length; j < ilen; j++) {
        items[j].deregisterObserver(r.tail, r.path, r.observee, r.observer,
                                    r.action);
      }
    }
  }
});

// shortcut for instantiating a new array
Z.A = function() {
  var args = slice.call(arguments), len = args.length, first = args[0];

  if (len === 1 && (Z.isArray(first) || (first && first.isZArray))) {
    return Z.Array.create(first);
  }

  return Z.Array.create(args);
};

}());
