(function(undefined) {

var slice = Array.prototype.slice, repo, NEW, EMPTY, LOADED, DESTROYED;

repo = Z.Object.extend(function() {
  function dependentPathDidChange(notification) {
    var query = notification.context, model = notification.observee;
    query.check(model);
  }

  function attachQueryObservers(model, query) {
    var paths = query.dependentPaths, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      model.observe(paths[i], null, dependentPathDidChange, {context: query});
    }
  }

  function detachQueryObservers(model, query) {
    var paths = query.dependentPaths, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      model.stopObserving(paths[i], null, dependentPathDidChange, {context: query});
    }
  }

  this.def('initialize', function() {
    this.idMap   = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); });
    this.queries = Z.H();
  });

  this.def('insert', function(model) {
    var baseType = model.basePrototype(),
        map      = this.idMap.at(baseType),
        queries  = this.queries.at(baseType),
        id       = model.id();

    if (map.hasKey(id)) {
      throw new Error(Z.fmt("%@: a model with the id `%@` already exists",
                            model.prototypeName(), id));
    }

    map.at(id, model);

    if (!queries) { return; }

    queries.each(function(query) {
      attachQueryObservers(model, query);
      query.check(model);
    });
  });

  this.def('retrieve', function(type, id) {
    return this.idMap.at(type.basePrototype()).at(id);
  });

  this.def('remove', function(model) {
    var baseType = model.basePrototype(),
        map      = this.idMap.at(baseType),
        queries  = this.queries.at(baseType);

    map.del(model.id());

    if (!queries) { return; }

    queries.each(function(query) {
      detachQueryObservers(model, query);
      query.remove(model);
    });
  });

  this.def('reset', function(query) {
    this.idMap = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); });
    this.queries.each(function(tuple) { tuple[1].invoke('clear'); });
  });

  this.def('registerQuery', function(query) {
    var self     = this,
        baseType = query.modelType.basePrototype(),
        map      = this.idMap.at(baseType),
        queries  = this.queries.at(baseType);

    if (!queries) { queries = this.queries.at(baseType, Z.A()); }

    queries.push(query);

    map.each(function(tuple) {
      query.check(tuple[1]);
      attachQueryObservers(tuple[1], query);
    });
  });

  this.def('deregisterQuery', function(query) {
    var baseType = query.modelType.basePrototype(),
        map      = this.idMap.at(baseType);

    this.queries.at(baseType).remove(query);

    map.each(function(tuple) {
      detachQueryObservers(tuple[1], query);
    });
  });
}).create();

function setState(state) {
  var source = false, dirty = false, invalid = false, busy = false;

  if (state.hasOwnProperty('source') && state.source !== this.__sourceState__) {
    source = true;
    this.willChangeProperty('sourceState');
  }

  if (state.hasOwnProperty('dirty') && state.dirty !== this.__isDirty__) {
    dirty = true;
    this.willChangeProperty('isDirty');
  }

  if (state.hasOwnProperty('invalid') && state.invalid !== this.__isInvalid__) {
    invalid = true;
    this.willChangeProperty('isInvalid');
  }

  if (state.hasOwnProperty('busy') && state.busy !== this.__isBusy__) {
    busy = true;
    this.willChangeProperty('isBusy');
  }

  if (source)  { this.__sourceState__ = state.source; }
  if (dirty)   { this.__isDirty__     = state.dirty; }
  if (invalid) { this.__isInvalid__   = state.invalid; }
  if (busy)    { this.__isBusy__      = state.busy; }

  if (source)  { this.didChangeProperty('sourceState'); }
  if (dirty)   { this.didChangeProperty('isDirty'); }
  if (invalid) { this.didChangeProperty('isInvalid'); }
  if (busy)    { this.didChangeProperty('isBusy'); }
}

Z.Model = Z.Object.extend(function() {
  var attributeTypes = {};

  this.isZModel = true;

  this.mapper = Z.Mapper.create();

  // source state
  this.NEW       = NEW       = 'new';
  this.EMPTY     = EMPTY     = 'empty';
  this.LOADED    = LOADED    = 'loaded';
  this.DESTROYED = DESTROYED = 'destroyed';

  function getHasOne(descriptor) {
    return this[Z.fmt("__%@__", descriptor.name)] || null;
  }

  function _setHasOne(descriptor, val) {
    var name   = descriptor.name,
        owner  = descriptor.owner,
        key    = Z.fmt("__%@__", name),
        state  = this.sourceState();

    if (owner) {
      if ((state !== NEW && state !== LOADED) || this.isBusy()) {
        throw new Error(Z.fmt("%@.%@: can't set a hasOne association when the owner side is %@: %@",
                              this.prototypeName(), name, this.stateString(), this));
      }
    }

    this.willChangeProperty(name);
    this[key] = val;
    if (owner && state === LOADED) { setState.call(this, {dirty: true}); }
    this.didChangeProperty(name);
  }

  function setHasOne(descriptor, val) {
    var name    = descriptor.name,
        key     = Z.fmt("__%@__", name),
        prev    = this[key],
        type    = Z.resolve(descriptor.modelType),
        inverse = descriptor.inverse,
        state   = this.sourceState();

    if (val && (!Z.isZObject(val) || (!val.isA(type)))) {
      throw new Error(Z.fmt("%@.%@: expected an object of type `%@` but received %@ instead",
                            this.prototypeName(), name, descriptor.modelType, Z.inspect(val)));
    }

    _setHasOne.call(this, descriptor, val);

    if (inverse && prev) { prev.inverseDidRemove(inverse, this); }
    if (inverse && val) { val.inverseDidAdd(inverse, this); }

    return val;
  }

  function getHasMany(descriptor) {
    var key = Z.fmt("__%@__", descriptor.name);

    return this[key] = this[key] || Z.HasManyArray.create(this, descriptor);
  }

  function setHasMany(descriptor, v) {
    var key = Z.fmt("__%@__", descriptor.name),
        a   = getHasMany.call(this, descriptor);

    a.splice.apply(a, [0, a.size()].concat(v.isZArray ? v.toNative() : v));

    return v;
  }

  function callValidatorFn(context, fn) {
    return typeof fn === 'function' ? fn.call(context) : context[fn]();
  }

  this.property('id', {
    set: function(v) {
      if (this.hasOwnProperty('__id__')) {
        throw new Error(Z.fmt("%@.id (setter): overwriting a model's identity is not allowed: %@",
                              this.prototypeName(), this));
      }

      this.__id__ = v;
      repo.insert(this);

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
      throw new Error(Z.fmt("%@.attribute: unknown type: %@", this.prototypeName(), type));
    }

    this[Z.fmt("__z_attribute_%@__", name)] = opts;

    this.property(name, Z.merge({
      get: function() {
        if (this.sourceState() === EMPTY) {
          setState.call(this, {busy: true});
          this.mapper.fetchModel(this);
        }

        return attributeType.fromRawFn(this[privateProp]);
      },

      set: function(v) {
        var state = this.sourceState(), changes;

        if (state === EMPTY || this.isBusy()) {
          throw new Error(Z.fmt("%@.%@ (setter): can't set attributes on a model in the %@ state: %@",
                                this.prototypeName(), name, this.stateString(), this));
        }

        if (state !== NEW) {
          if (!this.isDirty()) {
            changes = this.set('changes', Z.H());
            setState.call(this, {dirty: true});
          }

          changes = changes || this.changes();

          if (!changes.hasKey(name)) { changes.at(name, this.get(name)); }
        }

        return this[privateProp] = attributeType.toRawFn(v);
      }
    }, opts));
  });

  // Returns a list of `Z.Model` sub-prototypes that are in the reciever's
  // inheritance chain.
  this.def('modelAncestors', function() {
    var ancestors = this.ancestors(), a = [], i, len;

    for (i = 0, len = ancestors.length; i < len; i++) {
      if (ancestors[i] === Z.Model) { break; }
      if (!ancestors[i].isA(Z.Module)) { a.push(ancestors[i]); }
    }

    return a;
  });

  this.def('basePrototype', function() {
    var a = this.modelAncestors();
    return a[a.length - 1];
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

  this.def('reset', function() { repo.reset(); });

  this.def('empty', function(id) {
    var name = this.prototypeName(), m = this.create({id: id});

    setState.call(m, {source: EMPTY});
    return m;
  });

  this.def('load', function(attrs) {
    var associations = this.associationDescriptors(), associated = {},
        model, other, key, type, data, i, len;

    if (Z.isUndefined(attrs.id)) {
      throw new Error(Z.fmt("%@.load: an `id` attribute is required",
                            this.prototypeName()));
    }

    attrs = Z.dup(attrs);
    model = repo.retrieve(this, attrs.id) || this.create({id: attrs.id});

    Z.del(attrs, 'id');

    // extract associated attributes
    for (key in associations) {
      associated[associations[key].name] = Z.del(attrs, associations[key].name);
    }

    // set raw attributes
    model.set(attrs);

    // load and set each association
    for (key in associated) {
      type = Z.resolve(associations[key].modelType);
      if (!(data = associated[key])) { continue; }

      if (associations[key].type === 'hasOne') {
        other = Z.isObject(data) ? type.load(data) :
          repo.retrieve(type, data) || type.empty(data);
        model.set(key, other);
        setState.call(other, {dirty: false});
      }
      else if (associations[key].type === 'hasMany') {
        for (i = 0, len = data.length; i < len; i++) {
          other = Z.isObject(data[i]) ? type.load(data[i]) :
            repo.retrieve(type, data[i]) || type.empty(data[i]);
          model.get(key).push(other);
          setState.call(other, {dirty: false});
        }
      }
    }

    setState.call(model, {source: LOADED, dirty: false, invalid: false, busy: false});

    return model;
  });

  this.def('fetch', function(id) {
    var model = repo.retrieve(this, id);

    if (model && !model.isA(this)) {
      throw new Error(Z.fmt("%@.fetch: a model with id `%@` was found in the identity map, but its prototype is `%@`",
                            this.prototypeName(), id, model.prototypeName()));
    }

    if (!model) {
      model = this.empty(id);
      setState.call(model, {busy: true});
      model.mapper.fetchModel(model);
    }

    return model;
  });

  this.def('refresh', function() {
    var state = this.sourceState();

    if (state !== LOADED || this.isBusy()) {
      throw new Error(Z.fmt("%@.refresh: can't refresh a model in the %@ state: %@",
                            this.prototypeName(), this.stateString(), this));
    }

    setState.call(this, {busy: true});
    this.mapper.fetchModel(this);
    return this;
  });

  this.def('fetchModelDidSucceed', function() {
    setState.call(this, {source: LOADED, busy: false});
  });

  this.def('fetchModelDidFail', function() {
    setState.call(this, {busy: false});
  });

  this.def('save', function() {
    var state = this.sourceState();

    if ((state !== NEW && state !== LOADED) || this.isBusy()) {
      throw new Error(Z.fmt("%@.save: can't save a model in the %@ state: %@",
                           this.prototypeName(), this.stateString(), this));
    }

    this.validate();

    if (this.isInvalid()) { return this; }

    if (state === NEW) {
      setState.call(this, {busy: true});
      this.mapper.createModel(this);
    }
    else if (this.isDirty()) {
      setState.call(this, {busy: true});
      this.mapper.updateModel(this);
    }

    return this;
  });

  this.def('createModelDidSucceed', function() {
    setState.call(this, {source: LOADED, busy: false});
  });

  this.def('createModelDidFail', function() {
    setState.call(this, {busy: false});
  });

  this.def('updateModelDidSucceed', function() {
    var changes = this.changes();
    if (changes) { changes.clear(); }
    setState.call(this, {dirty: false, busy: false});
  });

  this.def('updateModelDidFail', function() {
    setState.call(this, {busy: false});
  });

  this.def('destroy', function() {
    var state = this.sourceState();

    if (state === DESTROYED) { return this; }

    if (this.isBusy()) {
      throw new Error(Z.fmt("%@.destroy: can't destroy a model in the %@ state: %@",
                            this.prototypeName(), this.stateString(), this));
    }

    if (state === NEW) {
      this.destroyModelDidSucceed();
    }
    else {
      setState.call(this, {busy: true});
      this.mapper.destroyModel(this);
    }

    return this;
  });

  this.def('destroyModelDidSucceed', function() {
    var associations = this.associationDescriptors(), descriptor, k, m, i;

    repo.remove(this);
    setState.call(this, {source: DESTROYED, busy: false, invalid: false, dirty: false});

    // clear any associations this model is involved in
    for (k in associations) {
      descriptor = associations[k];
      if (!descriptor.inverse) { continue; }

      if (descriptor.type === 'hasOne') {
        if (m = this.get(k)) { m.inverseDidRemove(descriptor.inverse, this); }
      }
      else if (descriptor.type === 'hasMany') {
        for (i = this.get(k).size() - 1; i >= 0; i--) {
          this.get(k).at(i).inverseDidRemove(descriptor.inverse, this);
        }
      }
    }
  });

  this.def('destroyModelDidFail', function() {
    setState.call(this, {busy: false});
  });

  this.def('undoChanges', function() {
    var self = this, sourceState = this.sourceState(), changes;

    if (sourceState === DESTROYED) {
      throw new Error(Z.fmt("%@.undoChanges: attempted to undo changes on a DESTROYED model: %@",
                            this.prototypeName(), this.toString()));
    }

    if (!this.isDirty()) { return this; }

    changes = this.changes();
    changes.each(function(tuple) { self.set(tuple[0], tuple[1]); });
    changes.clear();
    setState.call(this, {dirty: false});

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
    setState.call(this, {invalid: true});
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

    if (this.get('errors.size') === 0) { setState.call(this, {invalid: false}); }
  });

  this.def('hasOne', function(name, modelType, opts) {
    var assocKey = Z.fmt("__z_association_%@__", name), descriptor;

    this[assocKey] = descriptor = Z.merge(Z.dup(opts), {
      type: 'hasOne', name: name, modelType: modelType
    });

    this.property(name, {
      auto: false,
      get: function() { return getHasOne.call(this, descriptor); },
      set: function(v) { return setHasOne.call(this, descriptor, v); }
    });
  });

  this.def('hasMany', function(name, modelType, opts) {
    var assocKey = Z.fmt("__z_association_%@__", name), descriptor;

    this[assocKey] = descriptor = Z.merge(Z.dup(opts), {
      type: 'hasMany', name: name, modelType: modelType
    });

    this.property(name, {
      get: function() { return getHasMany.call(this, descriptor); },
      set: function(v) { return setHasMany.call(this, descriptor, v); },
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

  this.def('initialize', function(attributes) {
    var props = {}, key;

    this.__sourceState__ = NEW;
    this.__isDirty__     = false;
    this.__isInvalid__   = false;
    this.__isBusy__      = false;

    if (attributes) {
      for (key in attributes) {
        if (this.hasProperty(key)) { props[key] = attributes[key]; }
      }
    }

    this.supr(props);
  });

  this.def('inverseDidAdd', function(associationName, model) {
    var descriptor = this.associationDescriptorFor(associationName);

    if (!descriptor) {
      throw new Error(Z.fmt("%@.inverseDidAdd: unknown association `%@`: %@",
                            this.prototypeName(), associationName, this));
    }

    if (descriptor.type === 'hasOne') {
      _setHasOne.call(this, descriptor, model);
    }
    else if (descriptor.type === 'hasMany') {
      this.get(associationName)._inverseAdd(model);
    }
  });

  this.def('inverseDidRemove', function(associationName, model) {
    var descriptor = this.associationDescriptorFor(associationName);

    if (descriptor.type === 'hasOne') {
      _setHasOne.call(this, descriptor, null);
    }
    else if (descriptor.type === 'hasMany') {
      this.get(associationName)._inverseRemove(model);
    }
  });

  this.def('toString', function() {
    var self = this, names, name, stateString, a, descriptors, descriptor, k, i, len;

    if (this.isPrototype) { return this.supr(); }

    name        = this.prototypeName();
    stateString = this.stateString();
    a           = ['id: ' + Z.inspect(this.id())];

    if (this.sourceState() === EMPTY) {
      return Z.fmt("#<%@ (%@) %@>", name, stateString, a);
    }

    descriptors = self.associationDescriptors();
    names       = self.attributeNames();

    for (i = 0, len = names.length; i < len; i++) {
      a.push(Z.fmt("%@: %@", names[i], Z.inspect(self.get(names[i]))));
    }

    for (k in descriptors) {
      descriptor = descriptors[k];
      if (descriptor.type === 'hasMany') {
        a.push(Z.fmt("%@: %@", descriptor.name, Z.inspect(self.get(descriptor.name).pluck('id').toNative())));
      }
      else {
        a.push(Z.fmt("%@: %@", descriptor.name, Z.inspect(self.get(descriptor.name + '.id'))));
      }
    }

    return Z.fmt("#<%@ (%@) %@>", name, stateString, a.join(', '));
  });

  this.def('query', function(opts) {
    var q = Z.Query.create(this, opts);
    repo.registerQuery(q);
    return q;
  });

  function stringToRaw(v) { return v ? v.toString() : v; }
  function integerToRaw(v) {
    if (typeof v === 'number') { return Math.round(v); }
    else if (typeof v === 'string') { return Math.round(parseFloat(v)); }
    return v;
  }
  function booleanToRaw(v) { return Z.isNull(v) ? v : !!v; }

  this.registerAttributeType('string', stringToRaw);
  this.registerAttributeType('integer', integerToRaw);
  this.registerAttributeType('boolean', booleanToRaw);
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
        state           = model.sourceState(),
        descriptor      = this.__z_descriptor__,
        owner           = descriptor.owner,
        inverse         = descriptor.inverse,
        type            = Z.resolve(descriptor.modelType),
        handlingInverse = this.__handlingInverse__,
        size            = this.size(),
        idx             = i < 0 ? size + i : i,
        added           = slice.call(arguments, 2),
        removed         = n > 0 ? this.slice(idx, n).toNative() : [],
        j, len;

    if (added.length === 0 && removed.length === 0) {
      this.supr.apply(this, slice.call(arguments));
    }

    if (owner) {
      if ((state !== NEW && state !== LOADED) || model.isBusy()) {
        throw new Error(Z.fmt("%@.%@: can't add to a hasMany association when the owner side is %@: %@",
                              model.prototypeName(), descriptor.name, model.stateString(), model));

      }
    }

    for (j = 0, len = added.length; j < len; j++) {
      if (!added[j].isA(type)) {
        throw new Error(Z.fmt("%@.%@: expected an object of type `%@` but received %@ instead",
                              model.prototypeName(), descriptor.name, descriptor.modelType, added[j]));
      }
    }

    this.supr.apply(this, slice.call(arguments));

    if (owner && state === LOADED) { setState.call(model, {dirty: true}); }

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

Z.Query = Z.SortedArray.extend(function() {
  function idcmp(a, b) { return Z.cmp(a.id(), b.id()); }
  function matchall() { return true; }

  this.def('initialize', function(type, opts) {
    opts = opts || {};

    this.modelType      = type;
    this.matchFn        = opts.matchFn || matchall;
    this.dependentPaths = opts.dependentPaths || [];

    return this.supr(opts.compareFn || idcmp);
  });

  this.def('check', function(model) {
    if (!model.isA(this.modelType)) { return; }
    if (this.matchFn(model)) {
      if (this.index(model) === null) { this.insert(model); }
    }
    else {
      this.remove(model);
    }
  });

  this.def('destroy', function() { repo.deregisterQuery(this); });
});

}());
