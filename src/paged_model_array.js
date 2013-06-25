Z.PagedModelArray = Z.Array.extend(function() {
  this.prop('error');

  this.prop('isBusy', {def: false});

  this.def('init', function(modelType, pageSize, defaultOpts) {
    this.supr();
    this.modelType     = modelType;
    this.pageSize      = pageSize;
    this.defaultOpts   = defaultOpts || {};
    this.__busyPages__ = Z.H();
  });

  this.def('at', function(i) {
    var r = this.supr.apply(this, arguments), pageSize = this.pageSize;

    if (arguments.length === 1 && pageSize && !r) {
      this.findPage(Math.floor(i / pageSize));
    }

    return r;
  });

  this.def('find', function(opts) {
    var page;

    this.opts = Z.merge({}, this.defaultOpts, opts);

    page = typeof this.opts.page === 'number' ? Z.del(this.opts, 'page') : 0;

    this.clear();
    this.findPage(page);

    return this;
  });

  this.def('findPage', function(page) {
    if (!this.__busyPages__.hasKey(page)) {
      this.__busyPages__.at(page, true);
      this.setif('isBusy', true);
      this.modelType.mapper.findPagedModels(this, page, this.opts);
    }

    return this;
  });

  this.def('findPagedModelsDidSucceed', function(models, page, total) {
    this.setif('size', total);
    this.__busyPages__.del(page);
    if (this.__busyPages__.size() === 0) { this.isBusy(false); }
    this.splice.apply(this, [page * this.pageSize, models.length].concat(models));

    return this;
  });

  this.def('findPagedModelsDidFail', function(error, page) {
    this.__busyPages__.del(page);
    if (this.__busyPages__.size() === 0) { this.isBusy(false); }
    this.error(error);

    return this;
  });
});
