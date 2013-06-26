// The `Z.ModelArray` is an array designed for loading model objects from the
// server. 
Z.ModelArray = Z.Array.extend(function() {
  // Internal: Triggers a `find` if a prior `find` call had been queued up due
  // to another `find` call being in progress.
  function processQueued() {
    var opts = this.__queued__;
    if (opts) {
      this.__queued__ = null;
      this.find(opts);
    }
  }

  // Public: The error string returned from the server when the request to fetch
  // the models fails.
  this.prop('error');

  // Public: A boolean property indicating whether the array is currently busy
  // loading the models from the server.
  this.prop('isBusy', {def: false});

  // Public: The `Z.PagedModelArray` constructor.
  //
  // modelType - A `Z.Model` sub type indicating the type of models that will be
  //             contained in the array.
  this.def('init', function(modelType) {
    this.supr();
    this.modelType = modelType;
  });

  // Public: Loads the models from the server by notifying the mapper via the
  // `findModels` method. If the array is currently busy, then the find options
  // are queued up until the previous `find` finishes.
  //
  // opts - A plain object containing key value pairs to pass on to the mapper.
  //
  // Returns the receiver.
  this.def('find', function(opts) {
    if (this.isBusy()) {
      this.__queued__ = opts;
    }
    else {
      this.isBusy(true);
      this.modelType.mapper.findModels(this, opts || {});
    }

    return this;
  });

  // Internal: The callback for the mapper to invoke once it has successfully
  // loaded the models. Replaces the given model as the contents of the array.
  //
  // models - The model objects fetched from the server.
  //
  // Returns the receiver.
  this.def('findModelsDidSucceed', function(models) {
    this.replace(models);
    this.set({isBusy: false, error: null});
    processQueued.call(this);
    return this;
  });

  // Internal: The callback for the mapper to invoke when it encounters an error
  // when attempted to fetch the models from the server.
  //
  // error - A string containing an error message.
  //
  // Returns the receiver.
  this.def('findModelsDidFail', function(error) {
    this.set({isBusy: false, error: error});
    processQueued.call(this);
    return this;
  });
});

