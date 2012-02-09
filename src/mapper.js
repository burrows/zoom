
Z.Mapper = Z.Object.extend(function() {
  this.def('fetchModel', function(type, id) {
    setTimeout(function() { type.fetchModelDidFail(id); }, 1);
  });

  this.def('createModel', function(model) {
  });

  this.def('updateModel', function(model) {
  });

  this.def('destroyModel', function(model) {
  });
});
