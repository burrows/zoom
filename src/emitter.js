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

  // Public: Registers a handler for the given event. When matching events are
  // emitted by the `emit` method, the handler will be invoked with three
  // arguments: the event that was emitted, the data argument passed to the
  // `emit` method, and the `context` option passed to `on`. The data and
  // context arguments may be `undefined`. By default the handler function will
  // be invoked in the context of the receiver, but this can be overridden by
  // specifying and `observer` option.
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
  // Examples
  //
  //   // handler will be invoked in the context of x any time the 'foo' event
  //   is emitted by x
  //   x.on('foo', handler);
  //
  //   // handler will be invoked any time the 'foo:bar' event is emitted
  //   x.on('foo:bar', handler);
  //
  //   // handler will be invoked any time a namespaced 'foo' event is emitted
  //   // but not when the unnamespaced 'foo' event is emitted
  //   x.on('foo:*', handler);
  //
  //   // handler will be invoked whenever any event with the 'bar' namespace is
  //   // emitted
  //   x.on('*:bar', handler)
  //
  //   // handler will be invoked whenever any namespaced event is emitted
  //   x.on('*:*', handler)
  //
  //   // handler will be invoked whenever any event (namespaced or not) is
  //   // emitted
  //   x.on('*', handler)
  //
  //   // handler will be invoked immediately as well as any time the 'foo'
  //   // event is emitted
  //   x.on('foo', handler, {fire: true});
  //
  //   // handler will be invoked the first time the 'foo' event is emitted and
  //   // never again
  //   x.on('foo', handler, {once: true});
  //
  //   // handler will be invoked in the context of the y object whenever the
  //   // 'foo' event is emitted
  //   x.on('foo', handler, {observer: y});
  //
  //   // handler will be invoked with z as the third (context) argument
  //   // whenever the 'foo' event is emitted
  //   x.on('foo', handler, {context: z});
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

  // Public: Deregisters a handler for the given event. A specific handler can
  // be removed by passing the same arguments to `.off` that were passed to
  // `.on` (including the `observer` and `context` option). Multiple handlers
  // can be removed at once by only specifying a subset of the arguments and
  // options passed to `.on`. For example, if you have multiple handler
  // functions registered for the 'foo' event, you can remove them all at once
  // like so:
  //
  //   x.off('foo');
  //
  // This would remove any handler registered for the 'foo' event'.
  //
  // event   - A string representing the event to unsubscribe from.
  // handler - Either a Function object or a string representing a method on the
  //           observer object.
  // opts    - A native object containing any of the following keys:
  //           observer - Only handlers registered for this observer object will
  //                      be removed.
  //           context  - Only handlers registered with this context object will
  //                      be removed.
  //
  // Returns the receiver.
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

      if (regs.length === 0) { delete this.__z_on__[keys[i]]; }
    }

    return this;
  });

  // Public: Emits an event by invoking all registered handlers that match the
  // given event name.
  //
  // event - A string representing the event to emit. This may be a bare event
  //         type or an event type and namespace separated by a ':'.
  // data  - An aribitraty object to pass along to handlers (default:
  //         `undefined`).
  //
  // Returns the receiver.
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

  // Public: The `Z.Emitter` destructor. Automatically removes all registered
  // event handlers.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    this.off();
    return this.supr();
  });
});

