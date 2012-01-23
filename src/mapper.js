
Z.Mapper = Z.Object.extend(function() {
  this.def('fetch', function(type, id) {
    setTimeout(function() { type.fetchDidFail(id); }, 1);
  });
});
