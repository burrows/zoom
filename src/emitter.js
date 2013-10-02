// The `Z.Emitter` module provides basic pub/sub functionality and is the
// underpinning of Zoom's key value observing functionality (provided by
// `Z.Observable`). `Z.Emitter` can be mixed in to any `Z.Object` sub-type to
// endow the object the ability to emit events that can be subscribed to by
// other objects. Events are represented by strings and may optionally be
// classified with a namespace. The event format is:
//
// type[:namespace]
//
// Emitter objects emit events with the `emit` method and other objects can
// subscribe to these events with the `on` method. When events are emitted, an
// optional data argument may be supplied that will be passed on to subscribers.
//
// Examples
//
//   var e = Z.Object.extend(Z.Emitter).create();
//
//   function someEventHandler() {
//     console.log('someEventHandler called');
//   }
//
//   function someEventWithFooNamespaceHandler() {
//     console.log('someEventWithFooNamespaceHandler called');
//   }
//
//   function someEventWithAnyNamespaceHandler(event) {
//     console.log('someEventWithAnyNamespaceHandler called');
//   }
//
//   e.on('someEvent', someEventHandler);
//   e.on('someEvent:foo', someEventWithFooNamespaceHandler);
//   e.on('someEvent:*', someEventWithAnyNamespaceHandler);
//
//   e.emit('someEvent');
//   // someEventHandlerCalled
//
//   e.emit('someEvent:foo');
//   // someEventWithFooNamespaceHandler called
//   // someEventWithAnyNamespaceHandler called
//
//   e.emit('someEvent:bar');
//   // someEventWithAnyNamespaceHandler called
Z.Emitter = Z.Module.extend(function() {
  // Internal: Triggers the handler associated with the given registration
  // object.
  //
  // reg   - A registration object created by the `.on` method.
  // event - An event string.
  // data  - A data argument to pass to the handler (optional).
  //
  // Returns nothing.
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

  // Public: Registers a handler for the given event.
  //
  // event   - A string representing the event to subscribe to.
  // handler - Either a Function object or a string representing a method on the
  //           observer object (which defaults to the receiver but can be set
  //           with the `observer` option.
  // opts    - A native object containing any of the following keys:
  //           observer - The object that the handler will be invoked in the
  //                      context of (this is the receiver by default).
  //           context  - An object to pass along to the handler when the event
  //                      is emitted (default: `null`).
  //           fire     - A boolean indicating whether to fire the handler
  //                      immediately after registering it (default: `false`).
  //           once     - A boolean indicating whether this handler should be
  //                      automatically removed after it is fired for the first
  //                      time.
  //
  // Returns the receiver.
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

