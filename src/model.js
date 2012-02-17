(function(undefined) {

var slice = Array.prototype.slice;

Z.Model = Z.Object.extend(function() {
  var attributeTypes = {}, identityMap = {}, NEW, EMPTY, LOADED, DESTROYED;

  this.isZModel = true;

  this.mapper = Z.Mapper.create();

  // source state
  this.NEW       = NEW       = 'new';
  this.EMPTY     = EMPTY     = 'empty';
  this.LOADED    = LOADED    = 'loaded';
  this.DESTROYED = DESTROYED = 'destroyed';

  function setState(o, state) {
    var source = false, dirty = false, invalid = false, busy = false;

    if (state.hasOwnProperty('source') && state.source !== o.__sourceState__) {
      source = true;
      o.willChangeProperty('sourceState');
    }

    if (state.hasOwnProperty('dirty') && state.dirty !== o.__isDirty__) {
      dirty = true;
      o.willChangeProperty('isDirty');
    }

    if (state.hasOwnProperty('invalid') && state.invalid !== o.__isInvalid__) {
      invalid = true;
      o.willChangeProperty('isInvalid');
    }

    if (state.hasOwnProperty('busy') && state.busy !== o.__isBusy__) {
      busy = true;
      o.willChangeProperty('isBusy');
    }

    if (source)  { o.__sourceState__ = state.source; }
    if (dirty)   { o.__isDirty__     = state.dirty; }
    if (invalid) { o.__isInvalid__   = state.invalid; }
    if (busy)    { o.__isBusy__      = state.busy; }

    if (source)  { o.didChangeProperty('sourceState'); }
    if (dirty)   { o.didChangeProperty('isDirty'); }
    if (invalid) { o.didChangeProperty('isInvalid'); }
    if (busy)    { o.didChangeProperty('isBusy'); }
  }

  function addToIdentityMap(model) {
    var typeId = model.type().objectId();

    identityMap[typeId] = identityMap[typeId] || {};
    identityMap[typeId][model.id()] = model;
  }

  function retrieveFromIdentityMap(type, id) {
    var typeId = type.objectId(), map = identityMap[typeId];
    return map && map[id] ? map[id] : null;
  }

  function hasManyAssociationDidChange(notification) {
    var name        = notification.context.name,
        previous    = notification.previous,
        current     = notification.current,
        association = this.associationDescriptorFor(name),
        inverse     = association.inverse,
        i, len;

    if (!inverse) { return; }

    if (current && !association.addingInverse) {
      for (i = 0, len = current.size(); i < len; i++) {
        current.at(i).inverseDidAdd(inverse, this);
      }
    }

    if (previous && !association.removingInverse) {
      for (i = 0, len = previous.size(); i < len; i++) {
        previous.at(i).inverseDidRemove(inverse, this);
      }
    }
  }

  function hasOneAssociationDidChange(notification) {
    var name        = notification.context.name,
        previous    = notification.previous,
        current     = notification.current,
        association = this.associationDescriptorFor(name),
        inverse     = association.inverse;

    if (!inverse) { return; }

    if (current && !association.addingInverse) {
      current.inverseDidAdd(inverse, this);
    }

    if (previous && !association.removingInverse) {
      previous.inverseDidRemove(inverse, this);
    }
  }

  function callValidatorFn(context, fn) {
    return typeof fn === 'function' ? fn.call(context) : context[fn]();
  }

  this.property('id', {
    set: function(v) {
      if (this.hasOwnProperty('__id__')) {
        throw new Error(Z.fmt("Z.Model.id (setter): overwriting a model's identity is not allowed: %@", this));
      }

      this.__id__ = v;
      addToIdentityMap(this);

      return v;
    }
  });

  this.property('sourceState', { readonly: true });
  this.property('isDirty', { readonly: true });
  this.property('isInvalid', { readonly: true });
  this.property('isBusy', { readonly: true });

  this.property('changes');
  this.property('errors');

  this.def('stateString', function() {
    var a = [this.sourceState().toUpperCase()];

    if (this.isDirty())   { a.push('DIRTY'); }
    if (this.isInvalid()) { a.push('INVALID'); }
    if (this.isBusy())    { a.push('BUSY'); }

    return a.join('-');
  });

  this.def('attribute', function(name, type, opts) {
    var privateProp   = Z.fmt("__z_%@__", name),
        attributeType = attributeTypes[type];

    if (!attributeType) {
      throw new Error(Z.fmt("Z.Model.attribute: unknown type: %@", type));
    }

    opts = opts || {};

    this[Z.fmt("__z_attribute_%@__", name)] = opts;

    this.property(name, {
      get: function() {
        return attributeType.fromRawFn(this[privateProp]);
      },

      set: function(v) {
        var changes;

        if (this.sourceState() !== NEW) {
          if (!this.isDirty()) {
            changes = this.set('changes', Z.H());
            setState(this, {dirty: true});
          }

          changes = changes || this.changes();

          if (!changes.hasKey(name)) { changes.at(name, this.get(name)); }
        }

        return this[privateProp] = attributeType.toRawFn(v);
      }
    });
  });

  this.def('attributeNames', function() {
    var names = [], k, match;

    for (k in this) {
      if ((match = k.match(/^__z_attribute_(.*)__$/))) {
        names.push(match[1]);
      }
    }

    return names;
  });

  this.def('registerAttributeType', function(name, toRawFn, fromRawFn) {
    attributeTypes[name] = {
      toRawFn: toRawFn || Z.identity,
      fromRawFn: fromRawFn || Z.identity
    };

    return this;
  });

  this.def('clearIdentityMap', function() { identityMap = {}; });

  this.def('load', function(attributes) {
    var id = attributes.id, model;

    if (typeof id === 'undefined') {
      throw new Error('Z.Model.load: an `id` attribute is required');
    }

    if ((model = retrieveFromIdentityMap(this, id))) {
      attributes = Z.dup(attributes);
      Z.del(attributes, 'id');
      model.set(attributes);
    }
    else {
      model = this.create(attributes);
    }

    setState(model, {source: LOADED, dirty: false, invalid: false, busy: false});

    return model;
  });

  this.def('fetch', function(id) {
    var model = retrieveFromIdentityMap(this, id);

    if (!model) {
      model = this.create({id: id});
      setState(model, {source: EMPTY, busy: true});
      this.mapper.fetchModel(model);
    }

    return model;
  });

  this.def('fetchModelDidSucceed', function() {
    setState(this, {source: LOADED, busy: false});
  });

  this.def('fetchModelDidFail', function() {
    setState(this, {busy: false});
  });

  this.def('save', function() {
    var sourceState = this.sourceState();

    if (this.isBusy()) {
      throw new Error(Z.fmt("Z.Model.save: attempted to save a BUSY model"));
    }

    if (sourceState === DESTROYED) {
      throw new Error(Z.fmt("Z.Model.save: attempted to save a DESTROYED model"));
    }

    if (this.isInvalid()) { return this; }

    if (sourceState === NEW) {
      setState(this, {busy: true});
      this.mapper.createModel(this);
    }
    else if (this.isDirty()) {
      setState(this, {busy: true});
      this.mapper.updateModel(this);
    }

    return this;
  });

  this.def('createModelDidSucceed', function() {
    setState(this, {source: LOADED, busy: false});
  });

  this.def('createModelDidFail', function() {
    setState(this, {busy: false});
  });

  this.def('updateModelDidSucceed', function() {
    this.changes().clear();
    setState(this, {dirty: false, busy: false});
  });

  this.def('updateModelDidFail', function() {
    setState(this, {busy: false});
  });

  this.def('destroy', function() {
    setState(this, {source: DESTROYED, busy: true});
    this.mapper.destroyModel(this);
    return this;
  });

  this.def('destroyModelDidSucceed', function() {
    setState(this, {busy: false});
  });

  this.def('undoChanges', function() {
    var self = this, sourceState = this.sourceState(), changes;

    if (sourceState === DESTROYED) {
      throw new Error("Z.Model.undoChanges: attempted to undo changes on a DESTROYED model: " + this.toString());
    }

    if (!this.isDirty()) { return this; }

    changes = this.changes();
    changes.each(function(k, v) { self.set(k, v); });
    changes.clear();
    setState(this, {dirty: false});

    return this;
  });

  this.def('registerValidator', function(f, opts) {
    this.__z_validators__ = this.__z_validators__ || [];
    this.__z_validators__.push([f, opts || {}]);
  });

  this.def('addError', function(attr, message) {
    if (!this.errors()) {
      this.errors(Z.Hash.create(function(h, k) { return h.at(k, Z.A()); }));
    }

    this.errors().at(attr).push(message);
    setState(this, {invalid: true});
  });

  this.def('validate', function() {
    var validators = this.__z_validators__, validator, opts, i, len;

    if (this.errors()) { this.errors().clear(); }

    if (!validators) { return; }

    for (i = 0, len = validators.length; i < len; i++) {
      validator = validators[i][0];
      opts      = validators[i][1];

      if (opts.hasOwnProperty('if')) {
        if (callValidatorFn(this, opts['if'])) {
          callValidatorFn(this, validator);
        }
      }
      else if (opts.hasOwnProperty('unless')) {
        if (!callValidatorFn(this, opts.unless)) {
          callValidatorFn(this, validator);
        }
      }
      else {
        callValidatorFn(this, validator);
      }
    }

    if (this.get('errors.size') === 0) { setState(this, {invalid: false}); }
  });

  this.def('toJSON', function() {
    var attrs = this.attributeNames(), o = {}, i, len;

    o.id = this.id();

    for (i = 0, len = attrs.length; i < len; i++) {
      o[attrs[i]] = this.get(attrs[i]);
    }

    return o;
  });

  this.def('hasMany', function(name, model, opts) {
    var assocKey   = Z.fmt("__z_association_%@__", name),
        privateKey = Z.fmt("__%@__", name);

    this[assocKey] = Z.merge(Z.dup(opts), {
      type: 'hasMany', name: name, model: model
    });

    this.property(name, {
      get: function() { return this[privateKey] = this[privateKey] || Z.A(); }
    });
  });

  this.def('hasOne', function(name, model, opts) {
    var assocKey   = Z.fmt("__z_association_%@__", name),
        privateKey = Z.fmt("__%@__", name);

    this[assocKey] = Z.merge(Z.dup(opts), {
      type: 'hasOne', name: name, model: model
    });

    this.property(name, {
      get: function() {
        return this[privateKey] = this[privateKey] || null;
      }
    });
  });

  this.def('associationDescriptors', function() {
    var assocs = {}, k, match;

    for (k in this) {
      if ((match = k.match(/^__z_association_(.*)__$/))) {
        assocs[match[1]] = this[k];
      }
    }

    return assocs;
  });

  this.def('associationDescriptorFor', function(name) {
    return this[Z.fmt('__z_association_%@__', name)];
  });

  this.def('initialize', function(attributes, state) {
    var associations = this.associationDescriptors(), association, k, id;

    this.__sourceState__ = NEW;
    this.__isDirty__     = false;
    this.__isInvalid__   = false;
    this.__isBusy__      = false;

    this.supr.apply(this, slice.call(arguments));

    if (attributes && attributes.hasOwnProperty('id')) {
      addToIdentityMap(this);
    }

    for (k in associations) {
      association = associations[k];

      if (association.type === 'hasMany') {
        this.observe(k + '.@', this, hasManyAssociationDidChange, {
          previous: true, current: true, context: { name: k }
        });
      }
      else if (association.type === 'hasOne') {
        this.observe(k, this, hasOneAssociationDidChange, {
          previous: true, current: true, context: { name: k }
        });
      }
    }
  });

  this.def('inverseDidAdd', function(associationName, object) {
    var association = this.associationDescriptorFor(associationName);

    association.addingInverse = true;

    if (association.type === 'hasOne') {
      this.set(associationName, object);
    }
    else if (association.type === 'hasMany') {
      this.get(associationName).push(object);
    }

    association.addingInverse = false;
  });

  this.def('inverseDidRemove', function(associationName, object) {
    var association = this.associationDescriptorFor(associationName);

    association.removingInverse = true;

    if (association.type === 'hasOne') {
      this.set(associationName, null);
    }
    else if (association.type === 'hasMany') {
      this.get(associationName).remove(object);
    }

    association.removingInverse = false;
  });

  this.def('toString', function() {
    return Z.fmt("#<%@:%@ (%@) %@>", this.prototypeName(), this.objectId(),
                 this.stateString(), Z.inspect(this.toJSON()));
  });

  function stringToRaw(v) { return v ? v.toString() : v; }
  function integerToRaw(v) {
    if (typeof v === 'number') { return Math.round(v); }
    else if (typeof v === 'string') { return Math.round(parseFloat(v)); }
    return v;
  }

  this.registerAttributeType('string', stringToRaw);
  this.registerAttributeType('integer', integerToRaw);
});

}());
