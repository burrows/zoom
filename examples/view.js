//------------------------------------------------------------------------------
// experimental view stuff
//------------------------------------------------------------------------------

Z.View = Z.Object.extend(function() {
  this.property('superview');

  this.property('subviews', {
    get: function() { return this.__subviews__ = this.__subviews__ || Z.A(); }
  });

  this.property('tag', {
    get: function() { return this.__tag__ || 'div'; }
  });

  this.property('element', {
    readonly: true,
    get: function() { return $(Z.fmt("#z-view-%@", this.objectId()))[0]; }
  });

  this.property('isDisplayed', {
    get: function() { return this.__isDisplayed__ = this.__isDisplayed__ || false; }
  });

  this.def('subview', function(name, type) {
    (this.__subviewTypes__ = this.__subviewTypes__ || Z.H()).at(name, type);
    this.property(name);
  });

  this.def('initialize', function(props) {
    var self = this, subviewTypes = this.__subviewTypes__;

    this.supr(props);

    if (subviewTypes) {
      subviewTypes.each(function(name, type) {
        var view = type.create({superview: self});

        self.set(name, view);
        self.subviews().push(view);
      });
    }
  });

  this.def('render', function() {
    return Z.fmt('<%@ id="z-view-%@">%@</%@>',
      this.tag(), this.objectId(), this.renderContent(), this.tag());
  });

  this.def('renderContent', function() {
    return this.subviews().map(function(subview) {
      return subview.render();
    }).join('');
  });

  this.def('didDisplay', function() {
    this.set('isDisplayed', true);
    this.observe('subviews.@', this, 'subviewsDidChange', {prior: true});
    this.subviews().invoke('didDisplay');
  });

  this.def('didRemove', function() {
    this.set('isDisplayed', false);
    this.stopObserving('subviews.@', this, 'subviewsDidChange');
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

  this.def('didRemoveSubview', function(view) {
    $(view.element()).remove();
    view.superview(null);
    view.didRemove();
  });

  this.def('didAddSubview', function(view, idx) {
    var element = $(this.element()), html = view.render();

    if (idx === 0) { element.prepend(html); }
    else { element.children(Z.fmt(':eq(%@)', idx - 1)).after(html); }

    view.superview(this);
    view.didDisplay();
  });
});

Z.ListView = Z.View.extend(function() {
  this.tag('ul');
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
        i, len;

    switch (n.type) {
      case 'change':
        if (items) {
          this.subviews(items.map(function(item) {
            return itemView.create({superview: self, content: item, tag: 'li'});
          }));
        }
        else {
          this.subviews().clear();
        }
        break;
      case 'insert':
        for (i = n.range[0], len = i + n.range[1]; i < len; i++) {
          subviews.splice(i, 0, itemView.create({superview: this, content: items.at(i), tag: 'li'}));
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

Z.RootView = Z.View.extend(function() {
  this.property('container');

  this.def('display', function() {
    $(this.container()).html(this.render());
    // add event listeners
    this.didDisplay();
    return this;
  });
});

