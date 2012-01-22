
Z.Mapper = Z.Object.extend(function() {
  this.def('fetch', function(model, id) {
    setTimeout(function() { model.state(Z.Model.NOT_FOUND); }, 1);
  });
});
