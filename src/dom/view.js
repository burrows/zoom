(function(undefined) {

Z.DOMView = Z.View.extend(function() {
  this.prop('tag', { def: 'div' });

  this.def('buildContext', function() {
    var id = this.objectId(), tag = this.tag();
    return $(Z.fmt('<%@ id="z-view-%@" class="z-view"></%@>', tag, id, tag));
  });

  //this.def('willRemoveSubview', function(subview, idx) {
  //  this.supr(subview, idx);
  //  subview.context().remove();
  //});

  //this.def('didAddSubview', function(subview, idx) {
  //  var context = this.context();

  //  this.supr(subview, idx);
  //  subview.draw(); // FIXME: only if dirty

  //  if (idx === 0) { context.prepend(subview.context()); }
  //  else { context.children().eq(idx - 1).after(subview.context()); }
  //});
});

}());


