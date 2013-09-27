Z.Emitter = Z.Module.extend(function() {
  var slice = Array.prototype.slice;

  function trigger(reg, n) {
    var handler = typeof reg.handler === 'string' ?
      reg.observer[reg.handler] : reg.handler;

    if (reg.context) {
      handler.call(reg.observer, Z.merge({}, n, {context: reg.context}));
    }
    else {
      handler.call(reg.observer, n);
    }
  }

  this.def('on', function(event, handler, opts) {
    var reg;

    this.__z_on__ = this.__z_on__ || {};
    this.__z_on__[event] = this.__z_on__[event] || [];

    opts = Z.merge({
      observer: this,
      context: null,
      fire: false,
      once: false
    }, opts);

    reg = {
      handler: handler,
      observer: opts.observer,
      context: opts.context,
      once: opts.once
    };
    this.__z_on__[event].push(reg);

    if (opts.fire) { trigger(reg, {event: event}); }

    return this;
  });

  this.def('off', function(event, handler, opts) {
    var regs, keys, i, j, n;

    if (!this.__z_on__) { return this; }

    opts = opts || {};

    keys = event ? [event] : Z.H(this.__z_on__).keys().toNative();

    for (i = 0, n = keys.length; i < n; i++) {
      if (!(regs = this.__z_on__[keys[i]])) { continue; }

      for (j = regs.length - 1; j >= 0; j--) {
        if (handler && handler !== regs[j].handler) { continue; }
        if (opts.observer && opts.observer !== regs[j].observer) { continue; }
        if (opts.context && opts.context !== regs[j].context) { continue; }
        regs.splice(j, 1);
      }
    }

    return this;
  });

  this.def('emit', function(event) {
    var args, keys, parts, regs, n, len, i, j;

    if (!this.__z_on__) { return this; }

    args = slice.call(arguments, 1);
    keys = [event, '*'];
    n    = {event: event};

    if (args.length) { n.args = args; }

    if (event.indexOf(':') >= 0) {
      // event is namespaced, so add in wildcard keys
      parts = event.split(':');
      keys.push(parts[0] + ':*');
      keys.push('*:' + parts[1]);
      keys.push('*:*');
    }

    for (i = 0, len = keys.length; i < len; i++) {
      if (!(regs = this.__z_on__[keys[i]])) { continue; }

      for (j = regs.length - 1; j >= 0; j--) {
        trigger(regs[j], n);
        if (regs[j].once) { regs.splice(j, 1); }
      }
    }

    return this;
  });
});

