Z.Binding = Z.Object.extend(function() {
  var queue, defaultOpts;

  queue = [];

  defaultOpts = {oneway: false};

  function toDidChange() {
    if (!this.changed) { queue.push(this); }
    this.changed = 'to';
  }

  function fromDidChange() {
    if (!this.changed) { queue.push(this); }
    this.changed = 'from';
  }

  this.def('flush', function() {
    var b, src, srcPath, dst, dstPath, v;

    while (b = queue.shift()) {
      if (b.changed === 'to') {
        src     = b.to;
        srcPath = b.toPath;
        dst     = b.from;
        dstPath = b.fromPath;
      }
      else {
        src     = b.from;
        srcPath = b.fromPath;
        dst     = b.to;
        dstPath = b.toPath;
      }

      v = typeof b.opts.transform === 'function' ?
        b.opts.transform(src.get(srcPath), b.changed) : src.get(srcPath);
      dst.set(dstPath, v);
      b.changed = null;
    }
  });

  this.def('init', function(to, toPath, from, fromPath, opts) {
    this.to       = to;
    this.toPath   = toPath;
    this.from     = from;
    this.fromPath = fromPath;
    this.opts     = Z.merge({}, defaultOpts, opts);

    this.activate();
  });

  this.def('destroy', function() {
    return this.deactivate();
  });

  this.def('activate', function() {
    if (!this.activated) {
      if (!this.opts.oneway) {
        this.to.on('didChange:' + this.toPath, toDidChange, {observer: this});
      }
      this.from.on('didChange:' + this.fromPath, fromDidChange, {observer: this, fire: true});
      this.activated = true;
    }

    return this;
  });

  this.def('deactivate', function() {
    if (this.activated) {
      if (!this.opts.oneway) {
        this.to.off('didChange:' + this.toPath, toDidChange, {observer: this});
      }
      this.from.off('didChange:' + this.fromPath, fromDidChange, {observer: this});
      this.activated = false;
    }

    return this;
  });
});

