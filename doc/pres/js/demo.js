jQuery(function($) {
  var realConsole = console, demoConsole;

  demoConsole = {
    logElem: null,

    log: function() {
      var i, len;

      for (i = 0, len = arguments.length; i < len; i++) {
        var text   = $(this.logElem).text(),
            output = Z.inspect(arguments[i]);

        $(this.logElem).text(text + output + "\n");
      }
    }
  }

  $(document).keydown(function(evt) {
    if (!evt.ctrlKey) { return; }

    if (evt.which === 82) { // ctrl-r
      var logElem = $('section.present table.demo td.log pre'),
          code    = $('section.present table.demo td.code code').text();

      try {
        demoConsole.logElem = logElem;
        window.console      = demoConsole;

        eval(code);
      }
      finally {
        window.console = realConsole;
      }
    }
    else if (evt.which === 67) { // ctrl-c
      $('section.present table.demo td.log pre').text('');
    }
  });
});
