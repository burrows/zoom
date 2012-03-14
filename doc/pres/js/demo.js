jQuery(function($) {
  var realConsole = console, demoConsole;

  demoConsole = {
    logElem: null,

    log: function() {
      var a = [], text = $(this.logElem).text(), i, len;

      for (i = 0, len = arguments.length; i < len; i++) {
        a.push(arguments[i]);
      }

      $(this.logElem).text(text + a.join(' ') + "\n");
    }
  }

  $(document).keydown(function(evt) {
    if (evt.which === 82) { // r
      var logElem = $('section.present table.demo td.log pre'),
          code    = $('section.present table.demo td.code code').text();

      try {
        demoConsole.logElem = logElem;
        window.console      = demoConsole;

        eval(code);
      }
      catch (e) {
        console.log(e);
      }
      finally {
        window.console = realConsole;
      }
    }
    else if (evt.which === 67) { // c
      $('section.present table.demo td.log pre').text('');
    }
  });
});
