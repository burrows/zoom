(function() {

Z.DOMWindow = Z.Window.extend(function() {
  this.def('initialize', function(props) {
    this.supr(props);
  });

  this.def('buildContext', function() {
    return $(Z.fmt('<div id="z-window-%@" class="z-window"></div>',
                   this.objectId()));
  });

  this.def('draw', function() {
    this.get('app.container').append(this.context());
  });
});

}());

