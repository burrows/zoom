(function() {

Z.DOMApp = Z.App.extend(function() {
  this.windowType = Z.DOMWindow;

  this.prop('container', { def: $('body') });

  this.def('initialize', function(props) {
    this.supr(props);
    this.container().addClass('z-app');
  });

  this.def('listen', function() {
    console.log('DOMApp.listen');
  });
});

}());

