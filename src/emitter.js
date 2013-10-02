Z.Emitter = Z.Module.extend(function() {
  function trigger(reg, event, data) {
    var handler = typeof reg.handler === 'string' ?
      reg.observer[reg.handler] : reg.handler;

    if (reg.context) {
      handler.call(reg.observer, event, data, reg.context);
    }
    else {
      handler.call(reg.observer, event, data);
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

    if (opts.fire) { trigger(reg, event); }

    return this;
  });

  this.def('off', function(event, handler, opts) {
    var regs, keys, i, j, n;

    if (!this.__z_on__) { return this; }

    opts = opts || {};

    keys = event ? [event] : Object.keys(this.__z_on__);

    for (i = 0, n = keys.length; i < n; i++) {
      if (!(regs = this.__z_on__[keys[i]])) { continue; }

      for (j = regs.length - 1; j >= 0; j--) {
        if (handler && handler !== regs[j].handler) { continue; }
        if (opts.observer && opts.observer !== regs[j].observer) { continue; }
        if (opts.context && opts.context !== regs[j].context) { continue; }
        regs.splice(j, 1);
      }

      if (regs.length === 0) { delete this.__z_on__[keys[i]]; }
    }

    return this;
  });

  this.def('emit', function(event, data) {
    var keys, parts, regs, len, i, j;

    if (!this.__z_on__) { return this; }

    keys = [event, '*'];

    if (event.indexOf(':') >= 0) {
      parts = event.split(':');
      keys.push(parts[0] + ':*');
      keys.push('*:' + parts[1]);
      keys.push('*:*');
    }

    for (i = 0, len = keys.length; i < len; i++) {
      if (!(regs = this.__z_on__[keys[i]])) { continue; }

      for (j = regs.length - 1; j >= 0; j--) {
        trigger(regs[j], event, data);
        if (regs[j].once) {
          this.off(keys[i], regs[j].handler, {
            observer: regs[j].observer,
            context: regs[j].context
          });
        }
      }
    }

    return this;
  });

  this.def('destroy', function() {
    this.off();
    return this.supr();
  });
});

