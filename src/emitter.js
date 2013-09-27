Z.Emitter = Z.Module.extend(function() {
  function trigger(reg, event) {
    var handler = typeof reg.handler === 'string' ?
      reg.observer[reg.handler] : reg.handler;

    if (reg.context) {
      handler.call(reg.observer, event, reg.context);
    }
    else {
      handler.call(reg.observer, event);
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
    var regs, i;

    if (!this.__z_on__ || !(regs = this.__z_on__[event])) { return this; }

    opts = Z.merge({observer: this}, opts);

    for (i = regs.length - 1; i >= 0; i--) {
      if (handler && handler !== regs[i].handler) { continue; }
      if (opts.observer !== regs[i].observer) { continue; }
      regs.splice(i, 1);
    }

    return this;
  });

  this.def('emit', function(event) {
    var regs, i;

    if (!this.__z_on__ || !(regs = this.__z_on__[event])) { return this; }

    for (i = regs.length - 1; i >= 0; i--) {
      trigger(regs[i], event);
      if (regs[i].once) { regs.splice(i, 1); }
    }

    return this;
  });
});

