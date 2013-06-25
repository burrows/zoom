Z.ModelArray = Z.Array.extend(function() {
  function processQueued() {
    var opts = this.__queued__;
    if (opts) {
      this.__queued__ = null;
      this.find(opts);
    }
  }

  this.prop('error');

  this.prop('isBusy', {def: false});

  this.def('init', function(modelType) {
    this.supr();
    this.modelType = modelType;
  });

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

  this.def('findModelsDidSucceed', function(models) {
    this.replace(models);
    this.set({isBusy: false, error: null});
    processQueued.call(this);
    return this;
  });

  this.def('findModelsDidFail', function(error) {
    this.set({isBusy: false, error: error});
    processQueued.call(this);
    return this;
  });
});


