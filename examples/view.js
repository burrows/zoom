(function() {

//------------------------------------------------------------------------------
// experimental view stuff
//------------------------------------------------------------------------------

Z.View = Z.Object.extend(function() {
  this.property('superview');

  this.property('subviews', {
    get: function() { return this.__subviews__ = this.__subviews__ || Z.A(); }
  });

  this.property('tag', { def: 'div' });
  this.property('classes', {
    get: function() { return this.__classes__ = this.__classes__ || Z.A('z-view'); }
  });

  this.property('element', {
    readonly: true,
    get: function() { return $(Z.fmt("#z-view-%@", this.objectId()))[0]; }
  });

  this.property('isDisplayed', { def: false });

  this.def('extended', function(proto) {
    proto.classes(Z.Array.create(this.classes().toNative()));
  });

  this.def('subview', function(name, type) {
    (this.__subviewTypes__ = this.__subviewTypes__ || Z.H()).at(name, type);
    this.property(name);
  });

  this.def('initialize', function(props) {
    var self = this, subviewTypes = this.__subviewTypes__;

    this.supr(props);

    if (subviewTypes) {
      subviewTypes.each(function(tuple) {
        var view = tuple[1].create({superview: self});

        self.set(tuple[0], view);
        self.subviews().push(view);
      });
    }
  });

  this.def('render', function() {
    return Z.fmt('<%@ id="z-view-%@" class="%@">%@</%@>',
      this.tag(), this.objectId(), this.classes().join(' '),
      this.renderContent(), this.tag());
  });

  this.def('renderContent', function() {
    return '<tbody>' + this.subviews().map(function(subview) {
      return subview.render();
    }).join('') + '</tbody>';
  });

  this.def('didDisplay', function() {
    $.data(this.element(), 'z-view', this);
    this.set('isDisplayed', true);
    this.observe('subviews.@', this, 'subviewsDidChange', {prior: true});
    this.observe('classes.@', this, 'classesDidChange');
    this.subviews().invoke('didDisplay');
  });

  this.def('didRemove', function() {
    this.set('isDisplayed', false);
    this.stopObserving('subviews.@', this, 'subviewsDidChange');
    this.stopObserving('classes.@', this, 'classesDidChange');
    this.subviews().invoke('didRemove');
  });

  this.def('subviewsDidChange', function(n) {
    var type = n.type, subviews = this.subviews(), i, len;

    for (i = n.range[0], len = i + n.range[1]; i < len; i++) {
      if ((type === 'remove' || type === 'replace') && n.isPrior) {
        this.didRemoveSubview(subviews.at(i));
      }
      else if ((type === 'insert' || type === 'replace') && !n.isPrior) {
        this.didAddSubview(subviews.at(i), i);
      }
    }
  });

  this.def('classesDidChange', function() {
    $(this.element()).attr('class', this.classes().join(' '));
  });

  this.def('didRemoveSubview', function(view) {
    $(view.element()).remove();
    view.superview(null);
    view.didRemove();
  });

  this.def('didAddSubview', function(view, idx) {
    var element = $(this.element()), html = view.render();

    if (element.is('table')) { element = element.find('tbody'); }

    if (idx === 0) { element.prepend(html); }
    else {
      element.children(Z.fmt(':eq(%@)', idx - 1)).after(html);
    }

    view.superview(this);
    view.didDisplay();
  });

  this.def('dispatchEvent', function(evt) {
    var superview = this.superview(),
        handler   = 'handle' + evt.type[0].toUpperCase() + evt.type.slice(1) + 'Event';

    if (this.respondTo(handler)) { this[handler](evt); }
    if (superview) { superview.dispatchEvent(evt); }
  });
});

Z.ListView = Z.View.extend(function() {
  this.tag('ul');

  this.property('itemTag', { def: 'li' });
  this.property('items');
  this.property('itemView');

  this.def('initialize', function(props) {
    this.supr(props);
    this.observe('items.@', this, 'itemsDidChange');
    // FIXME: need to setup subviews here if we already have items
  });

  this.def('itemsDidChange', function(n) {
    var self     = this,
        subviews = this.subviews(),
        items    = this.items(),
        itemView = this.itemView(),
        itemTag  = this.itemTag(),
        views, i, len;

    switch (n.type) {
      case 'change':
        if (items) {
          views = items.map(function(item) {
            return itemView.create({superview: self, content: item, tag: itemTag});
          });
          subviews.splice.apply(subviews, [0, subviews.size()].concat(views.toNative()));
        }
        else {
          this.subviews().clear();
        }
        break;
      case 'insert':
        for (i = n.range[0], len = i + n.range[1]; i < len; i++) {
          subviews.splice(i, 0, itemView.create({superview: this, content: items.at(i), tag: itemTag}));
        }
        break;
      case 'remove':
        subviews.splice(n.range[0], n.range[1]);
        break;
      case 'replace':
        break;
    }
  });
});

var events = [
  'blur',
  'change',
  'click',
  'dblclick',
  'focus',
  'focusin',
  'focusout',
  'hover',
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseup',
  'resize',
  'scroll',
  'select',
  'submit'
];

Z.RootView = Z.View.extend(function() {
  this.property('container');

  this.def('display', function() {
    var container = $(this.container());

    container.html(this.render());

    this.didDisplay();

    container.on(events.join(' '), function(evt) {
      var view = $(evt.target).closest('.z-view').data('z-view');
      view.dispatchEvent(evt);
    });

    return this;
  });
});

}());