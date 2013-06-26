// The `Z.PagedModelArray` type provides a convenient object for loading models
// from the server in a paginated manner. It works by hooking into the model
// type's mapper to load pages when an attempt is made to access a model at an
// index that has yet to be fetched. This can be used in place of a regular
// `Z.Array` object as the content for a `Z.FastListView` in order to implement
// a list view that only loads models as they scroll into view.
Z.PagedModelArray = Z.Array.extend(function() {
  // Public: The error string returned from the server when a page fails to
  // load.
  this.prop('error');

  // Public: A boolean property indicating whether the array is currently busy
  // fetching a page.
  this.prop('isBusy', {def: false});

  // Public: The `Z.PagedModelArray` constructor.
  //
  // modelType   - A `Z.Model` sub type indicating the type of models that will
  //               be contained in the array.
  // pageSize    - The number of model objects to fetch per page.
  // defaultOpts - An optional set of options to pass to the mapper every time
  //               a page is loaded.
  this.def('init', function(modelType, pageSize, defaultOpts) {
    this.supr();
    this.modelType     = modelType;
    this.pageSize      = pageSize;
    this.defaultOpts   = defaultOpts || {};
    this.__busyPages__ = Z.H();
  });

  // Public: Overrides the implementation of `Z.Array.at` to notify the mapper
  // when an index is accessed that is inside a page that has yet to be loaded.
  //
  // Returns the model at the given index or `undefined` if the page has yet to
  //   be loaded.
  this.def('at', function(i) {
    var r = this.supr.apply(this, arguments), pageSize = this.pageSize;

    if (arguments.length === 1 && pageSize && !r) {
      this.findPage(Math.floor(i / pageSize));
    }

    return r;
  });

  // Public: Resets the array by loading the first page with the given options.
  //
  // opts - A plain object containing key value pairs to pass on to the mapper.
  //
  // Returns the receiver.
  this.def('find', function(opts) {
    var page;

    this.opts = Z.merge({}, this.defaultOpts, opts);

    page = typeof this.opts.page === 'number' ? Z.del(this.opts, 'page') : 0;

    this.clear();
    this.findPage(page);

    return this;
  });

  // Public: Notifies the mapper to fetch the given page number.
  //
  // page - The page of models to fetch (0-based).
  //
  // Returns the receiver.
  this.def('findPage', function(page) {
    if (!this.__busyPages__.hasKey(page)) {
      this.__busyPages__.at(page, true);
      this.setif('isBusy', true);
      this.modelType.mapper.findPagedModels(this, page, this.opts);
    }

    return this;
  });

  // Internal: The callback for the mapper to invoke once it has successfully
  // loaded a page of models. Inserts the fetched models into the array at the
  // appropriate page and sets the true size of the array.
  //
  // models - The model objects the make up the requested page.
  // page   - The page number that was originally requested.
  // total  - The total number of models that make up the entire array.
  //
  // Returns the receiver.
  this.def('findPagedModelsDidSucceed', function(models, page, total) {
    this.setif('size', total);
    this.__busyPages__.del(page);
    if (this.__busyPages__.size() === 0) { this.isBusy(false); }
    this.splice.apply(this, [page * this.pageSize, models.length].concat(models));

    return this;
  });

  // Internal: The callback for the mapper to invoke when it encounters an error
  // when attempting to fetch a page of models.
  //
  // error - A string containing an error message.
  // page  - The page number that was originally requested.
  //
  // Returns the receiver.
  this.def('findPagedModelsDidFail', function(error, page) {
    this.__busyPages__.del(page);
    if (this.__busyPages__.size() === 0) { this.isBusy(false); }
    this.error(error);

    return this;
  });
});
