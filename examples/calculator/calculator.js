(function() {

Calc = {};
Z.addNamespace(Calc, 'Calc');

Calc.CalculatorView = Z.View.extend(function() {
  this.prop('operand1');
  this.prop('operand2');
  this.prop('operator');

  this.def('init', function() {
    var view = this;

    this.supr();

    this.sc = Z.State.define(function() {
      //this.trace = true;

      this.state('start', function() {
        this.state('empty', function() {
          this.def('enter', function() {
            view.clear();
          });
        });

        this.state('result', function() {
          this.def('enter', function() {
            view.compute();
          });

          this.def('op', function(type) {
            this.goto('/operatorEntered', {context: type});
          });
        });

        this.def('number', function(n) {
          this.goto('/operand1/beforeDecimalPoint', {context: n});
        });

        this.def('decimalPoint', function() {
          this.goto('/operand1/afterDecimalPoint');
        });
      });

      this.state('operand1', function() {
        this.def('enter', function(n) {
          view.operand1(null);
          if (Z.isNumber(n)) { view.operand1Number(n); }
        });

        this.state('beforeDecimalPoint', function() {
          this.def('number', function(n) {
            view.operand1Number(n);
          });

          this.def('decimalPoint', function() {
            this.goto('/operand1/afterDecimalPoint');
          });
        });

        this.state('afterDecimalPoint', function() {
          this.def('enter', function() {
            view.operand1DecimalPoint();
          });

          this.def('number', function(n) {
            view.operand1Number(n);
          });
        });

        this.def('op', function(type) {
          this.goto('/operatorEntered', {context: type});
        });
      });

      this.state('operatorEntered', function() {
        this.def('enter', function(type) {
          if (view.operand1() !== null && view.operand2() !== null) {
            view.compute();
          }
          view.operator(type);
        });

        this.def('number', function(n) {
          this.goto('/operand2/beforeDecimalPoint', {context: n});
        });

        this.def('decimalPoint', function() {
          this.goto('/operand2/afterDecimalPoint');
        });
      });

      this.state('operand2', {hasHistory: true}, function() {
        this.def('enter', function(n) {
          if (Z.isNumber(n)) { view.operand2Number(n); }
        });

        this.state('beforeDecimalPoint', function() {
          this.def('number', function(n) {
            view.operand2Number(n);
          });

          this.def('decimalPoint', function() {
            this.goto('/operand2/afterDecimalPoint');
          });
        });

        this.state('afterDecimalPoint', function() {
          this.def('enter', function() {
            view.operand2DecimalPoint();
          });

          this.def('number', function(n) {
            view.operand2Number(n);
          });
        });

        this.def('op', function(type) {
          this.goto('/operatorEntered', {context: type});
        });

        this.def('compute', function() {
          this.goto('/start/result');
        });
      });

      this.def('clear', function() {
        this.goto('/start/empty');
      });
    });

    this.sc.observe('current', null, Z.log, {current: true, previous: true});

    this.sc.goto();
  });

  this.def('displayPaths', function() {
    return this.supr().concat('operand1', 'operand2', 'operator');
  });

  this.def('classes', function() {
    return this.supr().concat('calculator-view');
  });

  this.def('render', function() {
    if (this.__rendered__) { return this.update(); }

    this.node.innerHTML = '<div class="display"><div class="result">0</div>' +
      '<div class="operator"></div></div>' +
      '<button class="clear">C</button>' +
      '<button class="negate">±</button>' +
      '<button class="op divide">÷</button>' +
      '<button class="op multiply">×</button>' +
      '<button class="op subtract">−</button>' +
      '<button class="op add">+</button>' +
      '<button class="compute">=</button>' +
      '<button class="decimal">.</button>' +
      '<button class="number zero">0</button>' +
      '<button class="number one">1</button>' +
      '<button class="number two">2</button>' +
      '<button class="number three">3</button>' +
      '<button class="number four">4</button>' +
      '<button class="number five">5</button>' +
      '<button class="number six">6</button>' +
      '<button class="number seven">7</button>' +
      '<button class="number eight">8</button>' +
      '<button class="number nine">9</button>';

    this.__rendered__ = true;
  });

  this.def('update', function() {
    var node     = this.node,
        operand1 = this.operand1(),
        operand2 = this.operand2(),
        operator = this.operator();

    if (operand2) {
      node.querySelector('.result').innerHTML = operand2;
    }
    else if (operand1) {
      node.querySelector('.result').innerHTML = operand1;
    }
    else {
      node.querySelector('.result').innerHTML = '0';
    }

    node.querySelector('.operator').innerHTML = {
      null: '',
      add: '+',
      subtract: '−',
      multiply: '×',
      divide: '÷'
    }[operator];
  });

  this.def('mouseUp', function(e) {
    var node = e.node, classes = Z.Array.create(node.className.split(/\s+/));

    if (classes.contains('number')) {
      this.sc.send('number', parseInt(node.innerHTML, 10));
    }
    else if (classes.contains('op')) {
      this.sc.send('op', classes.reject(function(c) { return c === 'op'; }).first());
    }
    else if (classes.contains('negate')) {
      this.sc.send('negate');
    }
    else if (classes.contains('clear')) {
      this.sc.send('clear');
    }
    else if (classes.contains('compute')) {
      this.sc.send('compute');
    }
    else if (classes.contains('decimal')) {
      this.sc.send('decimalPoint');
    }
  });

  this.def('clear', function() {
    this.operand1(null);
    this.operand2(null);
    this.operator(null);
  });

  this.def('operand1Number', function(n) {
    this.operand1(((this.operand1() || '') + n.toString()).replace(/^0(\d+)/, '$1'));
  });

  this.def('operand1DecimalPoint', function() {
    this.operand1((this.operand1() || '0') + '.');
  });

  this.def('operand2Number', function(n) {
    this.operand2(((this.operand2() || '') + n.toString()).replace(/^0(\d+)/, '$1'));
  });

  this.def('operand2DecimalPoint', function() {
    this.operand2((this.operand2() || '0') + '.');
  });

  this.def('compute', function() {
    var op1 = parseFloat(this.operand1()), op2 = parseFloat(this.operand2());

    switch(this.operator()) {
      case 'add':
        this.operand1(op1 + op2);
        break;
      case 'subtract':
        this.operand1(op1 - op2);
        break;
      case 'multiply':
        this.operand1(op1 * op2);
        break;
      case 'divide':
        this.operand1(op1 / op2);
        break;
    }

    this.operand2(null);
    this.operator(null);
  });
});

document.addEventListener('DOMContentLoaded', function() {
  Calc.app = Z.App.create(Calc.CalculatorView, document.getElementById('app'));
  Calc.app.start();
});

}());
