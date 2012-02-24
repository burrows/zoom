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

  function _setHasOne(model, descriptor, val) {
    var name   = descriptor.name,
        master = descriptor.master,
        key    = Z.fmt("__%@__", name),
        state  = model.sourceState();

    if (master && state === EMPTY) {
      throw new Error(Z.fmt("Z.Model hasOne setter (%@): master side is EMPTY: %@", name, val));
    }

    if (master && model.isBusy()) {
      throw new Error(Z.fmt("Z.Model hasOne setter (%@): master side is BUSY: %@", name, val));
    }

    model.willChangeProperty(name);
    model[key] = val;
    model.didChangeProperty(name);

    if (state === LOADED && descriptor.master) {
      setState(model, {dirty: true});
    }
  }

  function getHasOne(model, descriptor) {
    return model[Z.fmt("__%@__", descriptor.name)] || null;
  }

  function setHasOne(model, descriptor, val) {
    var name    = descriptor.name,
        key     = Z.fmt("__%@__", name),
        prev    = model[key],
        type    = Z.resolve(descriptor.modelType),
        inverse = descriptor.inverse,
        state   = model.sourceState();

    if (val && (!Z.isZObject(val) || (!val.isA(type)))) {
      throw new Error(Z.fmt("Z.Model hasOne setter (%@): expected an object of type `%@`, but was given: %@", name, descriptor.modelType, val));
    }

    _setHasOne(model, descriptor, val);

    if (inverse && prev) { prev.inverseDidRemove(inverse, model); }
    if (inverse && val) { val.inverseDidAdd(inverse, model); }

    return val;
  }

  function getHasMany(model, descriptor) {
    var key = Z.fmt("__%@__", descriptor.name);

    return model[key] = model[key] || Z.HasManyArray.create(model, descriptor);
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
        if (this.sourceState() === EMPTY) {
          setState(this, {busy: true});
          this.mapper.fetchModel(this);
        }

        return attributeType.fromRawFn(this[privateProp]);
      },

      set: function(v) {
        var state = this.sourceState(), changes;

        if (state === EMPTY) {
          throw new Error(Z.fmt('Z.Model.set: attempted to set an attribute of an EMPTY model: %@', this));
        }

        if (state !== NEW) {
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

  this.def('empty', function(id) {
    var m;

    if (retrieveFromIdentityMap(this, id)) {
      throw new Error(Z.fmt("Z.Model.empty: an instance of `%@` with the id `%@` already exists", this.name(), id));
    }

    m = this.create({id: id});
    setState(m, {source: EMPTY});
    return m;
  });

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

  this.def('hasOne', function(name, type, opts) {
    var assocKey = Z.fmt("__z_association_%@__", name), descriptor;

    this[assocKey] = descriptor = Z.merge(Z.dup(opts), {
      type: 'hasOne', name: name, modelType: type
    });

    this.property(name, {
      auto: false,
      get: function() { return getHasOne(this, descriptor); },
      set: function(v) { return setHasOne(this, descriptor, v); }
    });
  });

  this.def('hasMany', function(name, modelType, opts) {
    var assocKey = Z.fmt("__z_association_%@__", name), descriptor;

    this[assocKey] = descriptor = Z.merge(Z.dup(opts), {
      type: 'hasMany', name: name, model: modelType
    });

    this.property(name, {
      readonly: true,
      get: function() { return getHasMany(this, descriptor); },
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
    this.__sourceState__ = NEW;
    this.__isDirty__     = false;
    this.__isInvalid__   = false;
    this.__isBusy__      = false;

    this.supr.apply(this, slice.call(arguments));

    if (attributes && attributes.hasOwnProperty('id')) {
      addToIdentityMap(this);
    }
  });

  this.def('inverseDidAdd', function(associationName, model) {
    var descriptor = this.associationDescriptorFor(associationName);

    if (!descriptor) {
      throw new Error("associationName:" + associationName);
    }

    if (descriptor.type === 'hasOne') {
      _setHasOne(this, descriptor, model);
    }
    else if (descriptor.type === 'hasMany') {
      this.get(associationName)._inverseAdd(model);
    }
  });

  this.def('inverseDidRemove', function(associationName, model) {
    var descriptor = this.associationDescriptorFor(associationName);

    if (descriptor.type === 'hasOne') {
      _setHasOne(this, descriptor, null);
    }
    else if (descriptor.type === 'hasMany') {
      this.get(associationName)._inverseRemove(model);
    }
  });

  this.def('toString', function() {
    var name        = this.prototypeName(),
        oid         = this.objectId(),
        id          = this.id(),
        state       = this.sourceState(),
        stateString = this.stateString();

    return state === EMPTY ?
      Z.fmt("#<%@:%@ (%@) {id: %@}>", name, oid, stateString, id) :
      Z.fmt("#<%@:%@ (%@) %@>", name, oid, stateString, Z.inspect(this.toJSON()));
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

Z.HasManyArray = Z.Array.extend(function() {
  this.def('initialize', function(model, descriptor) {
    this.__z_model__      = model;
    this.__z_descriptor__ = descriptor;

    return this.supr();
  });

  this.def('_inverseAdd', function(model) {
    this.__handlingInverse__ = true;
    this.push(model);
    this.__handlingInverse__ = false;
  });

  this.def('_inverseRemove', function(model) {
    var i, len;
    this.__handlingInverse__ = true;
    this.remove(model);
    this.__handlingInverse__ = false;
  });

  this.def('splice', function(i, n) {
    var model           = this.__z_model__,
        descriptor      = this.__z_descriptor__,
        master          = descriptor.master,
        inverse         = descriptor.inverse,
        handlingInverse = this.__handlingInverse__,
        size, idx, added, removed, j, len;

    //if (master) {
    // // - ensure new or loaded
    // // - ensure not busy
    //}

    size    = this.size();
    idx     = i < 0 ? size + i : i;
    added   = slice.call(arguments, 2);
    removed = n > 0 ? this.slice(idx, n).toNative() : [];

    //if (added.length > 0) {
    //  // check types
    //}

    this.supr.apply(this, slice.call(arguments));

    if (!handlingInverse && inverse) {
      for (j = 0, len = added.length; j < len; j++) {
        added[j].inverseDidAdd(inverse, model);
      }

      for (j = 0, len = removed.length; j < len; j++) {
        removed[j].inverseDidRemove(inverse, model);
      }
    }
  });
});

}());
