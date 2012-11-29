(function(undefined) {

var slice = Array.prototype.slice, attrTypes = [],
    repo, NEW, EMPTY, LOADED, DESTROYED;

repo = Z.Object.create().open(function() {
  function dependentPathDidChange(notification) {
    var query = notification.context, model = notification.observee;
    query.check(model);
  }

  function attachQueryObservers(model, query) {
    var paths = query.matchDependsOn, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      model.observe(paths[i], null, dependentPathDidChange, {context: query});
    }
  }

  function detachQueryObservers(model, query) {
    var paths = query.matchDependsOn, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      model.stopObserving(paths[i], null, dependentPathDidChange, {context: query});
    }
  }

  this.idMap   = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); });
  this.queries = Z.H();

  this.def('insert', function(model) {
    var baseType = model.baseType(),
        map      = this.idMap.at(baseType),
        queries  = this.queries.at(baseType),
        id       = model.id();

    if (map.hasKey(id)) {
      throw new Error(Z.fmt("%@: a model with the id `%@` already exists",
                            model.typeName(), id));
    }

    map.at(id, model);

    if (!queries) { return; }

    queries.each(function(query) {
      attachQueryObservers(model, query);
      query.check(model);
    });
  });

  this.def('retrieve', function(type, id) {
    return this.idMap.at(type.baseType()).at(id);
  });

  this.def('remove', function(model) {
    var baseType = model.baseType(),
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
    this.queries.each(function(tuple) { tuple[1].each('clear'); });
  });

  this.def('registerQuery', function(query) {
    var self     = this,
        baseType = query.modelType.baseType(),
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
    var baseType = query.modelType.baseType(),
        map      = this.idMap.at(baseType);

    this.queries.at(baseType).remove(query);

    map.each(function(tuple) {
      detachQueryObservers(tuple[1], query);
    });
  });
});

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

function isEditable(model) {
  var state = model.sourceState(), busy = model.isBusy();
  return model.__isLoading__ || ((state === NEW || state === LOADED) && !busy);
}

Z.Model = Z.Object.extend(function() {
  this.mapper = Z.Mapper.create();

  // source state
  this.NEW       = NEW       = 'new';
  this.EMPTY     = EMPTY     = 'empty';
  this.LOADED    = LOADED    = 'loaded';
  this.DESTROYED = DESTROYED = 'destroyed';

  function getHasOne(descriptor) {
    return this['__' + descriptor.name + '__'] || null;
  }

  function _setHasOne(descriptor, val) {
    var name   = descriptor.name,
        owner  = descriptor.owner,
        key    = '__' + name + '__',
        state  = this.sourceState();

    if (owner) {
      if (!isEditable(this)) {
        throw new Error(Z.fmt("%@.%@: can't set a hasOne association when the owner side is %@: %@",
                              this.typeName(), name, this.stateString(), this));
      }
    }

    this.willChangeProperty(name);
    this[key] = val;
    if (owner && state === LOADED) { setState.call(this, {dirty: true}); }
    this.didChangeProperty(name);
  }

  function setHasOne(descriptor, val) {
    var name    = descriptor.name,
        key     = '__' + name + '__',
        prev    = this[key],
        type    = Z.get(descriptor.modelType),
        inverse = descriptor.inverse,
        state   = this.sourceState();

    if (val && (!Z.isZObject(val) || (!val.isA(type)))) {
      throw new Error(Z.fmt("%@.%@: expected an object of type `%@` but received %@ instead",
                            this.typeName(), name, descriptor.modelType, Z.inspect(val)));
    }

    _setHasOne.call(this, descriptor, val);

    if (inverse && prev) { prev.inverseDidRemove(inverse, this); }
    if (inverse && val) { val.inverseDidAdd(inverse, this); }

    return val;
  }

  function getHasMany(descriptor) {
    var key = '__' + descriptor.name + '__';

    return this[key] = this[key] || Z.HasManyArray.create(this, descriptor);
  }

  function setHasMany(descriptor, v) {
    var key = '__' + descriptor.name + '__',
        a   = getHasMany.call(this, descriptor);

    a.splice.apply(a, [0, a.size()].concat(Z.isA(v, Z.Array) ? v.toNative() : v));

    return v;
  }

  function callValidatorFn(context, fn) {
    return typeof fn === 'function' ? fn.call(context) : context[fn]();
  }

  this.prop('id', {
    set: function(v) {
      if (this.hasOwnProperty('__id__')) {
        throw new Error(Z.fmt("%@.id (setter): overwriting a model's identity is not allowed: %@",
                              this.typeName(), this));
      }

      this.__id__ = v;
      repo.insert(this);

      return v;
    }
  });

  this.prop('sourceState', { readonly: true });
  this.prop('isDirty', { readonly: true });
  this.prop('isInvalid', { readonly: true });
  this.prop('isBusy', { readonly: true });

  this.prop('changes');
  this.prop('errors');

  this.def('stateString', function() {
    var a = [this.sourceState().toUpperCase()];

    if (this.isDirty())   { a.push('DIRTY'); }
    if (this.isInvalid()) { a.push('INVALID'); }
    if (this.isBusy())    { a.push('BUSY'); }

    return a.join('-');
  });

  this.def('registerAttrType', function(name, converter) {
    if (attrTypes[name]) {
      throw new Error(Z.fmt("Z.Model.registerAttrType: an attribute type with the name `%@` has already been defined", name));
    }

    attrTypes[name] = converter;
    return this;
  });

  this.def('attr', function(name, type, opts) {
    var converter = attrTypes[type],
        def       = Z.del(opts || {}, 'def') || null,
        nameKey, valueKey;

    if (!converter) {
      throw new Error(Z.fmt("%@.attr: unknown type: %@", this.typeName(), type));
    }

    converter = converter.create(opts);
    nameKey   = '__z_attribute_' + name + '__';
    valueKey  = '__' + name + '__';

    // records the existence of an attribute with the given name
    this[nameKey] = true;

    this.prop(name, {
      def: def,
      get: function() {
        if (this.sourceState() === EMPTY) {
          setState.call(this, {busy: true});
          this.mapper.fetchModel(this);
        }

        return converter.fromRaw(this[valueKey]);
      },
      set: function(v) {
        var state = this.sourceState(), changes;

        if (!isEditable(this)) {
          throw new Error(Z.fmt("%@.%@ (setter): can't set attributes on a model in the %@ state: %@",
                                this.typeName(), name, this.stateString(), this));
        }

        if (state === LOADED) {
          changes = this.changes() || this.changes(Z.H());
          if (!this.isDirty()) { setState.call(this, {dirty: true}); }
          if (!changes.hasKey(name)) { changes.at(name, this.get(name)); }
        }

        return this[valueKey] = converter.toRaw(v);
      }
    });
  });

  this.def('attrNames', function() {
    var names = [], k, match;

    for (k in this) {
      if ((match = k.match(/^__z_attribute_(.*)__$/))) {
        names.push(match[1]);
      }
    }

    return names;
  });

  this.def('rawAttrs', function() {
    var names = this.attrNames(), attrs = {}, i, len;

    for (i = 0, len = names.length; i < len; i++) {
      attrs[names[i]] = this['__' + names[i] + '__'];
    }

    return attrs;
  });

  this.def('attrs', function() {
    var names = this.attrNames(), attrs = {}, i, len;

    for (i = 0, len = names.length; i < len; i++) {
      attrs[names[i]] = this.get(names[i]);
    }

    return attrs;
  });


  // Returns a list of `Z.Model` sub-types that are in the receiver's prototype
  // chain.
  this.def('modelAncestors', function() {
    var ancestors = this.ancestors(), a = [], i, len;

    for (i = 0, len = ancestors.length; i < len; i++) {
      if (ancestors[i] === Z.Model) { break; }
      if (!ancestors[i].isA(Z.Module)) { a.push(ancestors[i]); }
    }

    return a;
  });

  this.def('baseType', function() {
    var a = this.modelAncestors();
    return a[a.length - 1];
  });

  this.def('reset', function() { repo.reset(); });

  this.def('empty', function(id) {
    var name = this.typeName(), m = this.create({id: id});

    setState.call(m, {source: EMPTY});
    return m;
  });

  this.def('load', function(attrs) {
    var associations = this.associationDescriptors(), associated = {},
        model, others, other, assoc, key, type, data, i, len;

    if (Z.isUndefined(attrs.id)) {
      throw new Error(Z.fmt("%@.load: an `id` attribute is required",
                            this.typeName()));
    }

    attrs = Z.dup(attrs);
    model = repo.retrieve(this, attrs.id) || this.create({id: attrs.id});

    model.__isLoading__ = true;

    Z.del(attrs, 'id');

    // extract associated attributes
    for (key in associations) {
      associated[associations[key].name] = Z.del(attrs, associations[key].name);
    }

    // set raw attributes
    model.set(attrs);

    // load and set each association
    for (key in associated) {
      type = Z.get(associations[key].modelType);
      if (!(data = associated[key])) { continue; }

      if (associations[key].type === 'hasOne') {
        other = Z.isObject(data) ? type.load(data) :
          repo.retrieve(type, data) || type.empty(data);
        if (model.get(key) !== other) { model.set(key, other); }
        setState.call(other, {dirty: false});
      }
      else if (associations[key].type === 'hasMany') {
        others = [];
        assoc  = model.get(key);

        for (i = 0, len = data.length; i < len; i++) {
          other = Z.isObject(data[i]) ? type.load(data[i]) :
            repo.retrieve(type, data[i]) || type.empty(data[i]);
          if (!assoc.contains(other)) { others.push(other); }
        }

        assoc.push.apply(assoc, others);

        for (i = 0, len = others.length; i < len; i++) {
          setState.call(others[i], {dirty: false});
        }
      }
    }

    model.__isLoading__ = false;
    setState.call(model, {source: LOADED, dirty: false, invalid: false, busy: false});

    return model;
  });

  this.def('fetch', function(id) {
    var model = repo.retrieve(this, id);

    if (model && !model.isA(this)) {
      throw new Error(Z.fmt("%@.fetch: a model with id `%@` was found in the identity map, but its prototype is `%@`",
                            this.typeName(), id, model.typeName()));
    }

    if (!model) {
      model = this.empty(id);
      setState.call(model, {busy: true});
      model.mapper.fetchModel(model);
    }

    return model;
  });

  this.def('refresh', function() {
    var state = this.sourceState(), args = [this].concat(slice.call(arguments));

    if (state !== LOADED || this.isBusy()) {
      throw new Error(Z.fmt("%@.refresh: can't refresh a model in the %@ state: %@",
                            this.typeName(), this.stateString(), this));
    }

    setState.call(this, {busy: true});
    this.mapper.fetchModel.apply(this.mapper, args);
    return this;
  });

  this.def('fetchModelDidSucceed', function() {
    setState.call(this, {source: LOADED, busy: false});
  });

  this.def('fetchModelDidFail', function() {
    setState.call(this, {busy: false});
  });

  this.def('save', function() {
    var state = this.sourceState(), args = [this].concat(slice.call(arguments));

    if ((state !== NEW && state !== LOADED) || this.isBusy()) {
      throw new Error(Z.fmt("%@.save: can't save a model in the %@ state: %@",
                           this.typeName(), this.stateString(), this));
    }

    this.validate();

    if (this.isInvalid()) { return this; }

    if (state === NEW) {
      setState.call(this, {busy: true});
      this.mapper.createModel.apply(this.mapper, args);
    }
    else if (this.isDirty()) {
      setState.call(this, {busy: true});
      this.mapper.updateModel.apply(this.mapper, args);
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
    var state = this.sourceState(), args = [this].concat(slice.call(arguments));

    if (state === DESTROYED) { return this; }

    if (this.isBusy()) {
      throw new Error(Z.fmt("%@.destroy: can't destroy a model in the %@ state: %@",
                            this.typeName(), this.stateString(), this));
    }

    if (state === NEW) {
      this.destroyModelDidSucceed();
    }
    else {
      setState.call(this, {busy: true});
      this.mapper.destroyModel.apply(this.mapper, args);
    }

    return this.supr();
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
                            this.typeName(), this.toString()));
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
    var assocKey = '__z_association_' + name + '__', descriptor;

    this[assocKey] = descriptor = Z.merge(Z.dup(opts), {
      type: 'hasOne', name: name, modelType: modelType
    });

    this.prop(name, {
      auto: false,
      get: function() { return getHasOne.call(this, descriptor); },
      set: function(v) { return setHasOne.call(this, descriptor, v); }
    });
  });

  this.def('hasMany', function(name, modelType, opts) {
    var assocKey = '__z_association_' + name + '__', descriptor;

    this[assocKey] = descriptor = Z.merge(Z.dup(opts), {
      type: 'hasMany', name: name, modelType: modelType
    });

    this.prop(name, {
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
    return this['__z_association_' + name + '__'];
  });

  this.def('init', function(attributes) {
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

    this.set(props);
  });

  this.def('inverseDidAdd', function(associationName, model) {
    var descriptor = this.associationDescriptorFor(associationName);

    if (!descriptor) {
      throw new Error(Z.fmt("%@.inverseDidAdd: unknown association `%@`: %@",
                            this.typeName(), associationName, this));
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

    if (this.isType) { return this.supr(); }

    name        = this.typeName();
    stateString = this.stateString();
    a           = ['id: ' + Z.inspect(this.id())];

    if (this.sourceState() === EMPTY) {
      return Z.fmt("#<%@ (%@) %@>", name, stateString, a);
    }

    descriptors = self.associationDescriptors();
    names       = self.attrNames();

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
});

Z.HasManyArray = Z.Array.extend(function() {
  this.def('init', function(model, descriptor) {
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
        type            = Z.get(descriptor.modelType),
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
      if (!isEditable(model)) {
        throw new Error(Z.fmt("%@.%@: can't add to a hasMany association when the owner side is %@: %@",
                              model.typeName(), descriptor.name, model.stateString(), model));

      }
    }

    for (j = 0, len = added.length; j < len; j++) {
      if (!added[j].isA(type)) {
        throw new Error(Z.fmt("%@.%@: expected an object of type `%@` but received %@ instead",
                              model.typeName(), descriptor.name, descriptor.modelType, added[j]));
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

    return this;
  });
});

Z.Query = Z.SortedArray.extend(function() {
  var defaultOpts = {
    matchFn: function() { return true; },
    matchDependsOn: []
  };

  this.def('init', function(type, opts) {
    var sortOpts = {};

    opts = Z.merge({}, defaultOpts, opts);

    this.modelType      = type;
    this.matchFn        = opts.matchFn;
    this.matchDependsOn = opts.matchDependsOn;
    this.objects        = {};

    if (opts.orderBy) { sortOpts.path = opts.orderBy; }
    if (opts.isDescending) { sortOpts.isDescending = true; }
    if (opts.compareFn) { sortOpts.compareFn = opts.compareFn; }
    if (opts.compareDependsOn) { sortOpts.dependsOn = opts.compareDependsOn; }

    if (!sortOpts.path && !sortOpts.compareFn) { sortOpts.path = 'id';  }

    this.supr(sortOpts);
  });

  this.def('check', function(model) {
    var id;

    if (!model.isA(this.modelType)) { return; }

    if (this.matchFn(model)) {
      id = model.id().toString();

      if (!this.objects[id]) {
        this.objects[id] = 1;
        this.insert(model);
      }
    }
    else {
      this.remove(model);
      delete this.objects[id];
    }
  });

  this.def('destroy', function() { repo.deregisterQuery(this); });
});

//------------------------------------------------------------------------------
// Attribute Converters
//------------------------------------------------------------------------------

Z.BaseAttr = Z.Object.extend(function() {
  this.def('toRaw', Z.identity);
  this.def('fromRaw', Z.identity);
});

Z.Model.registerAttrType('identity', Z.BaseAttr);

Z.StringAttr = Z.BaseAttr.extend(function() {
  this.def('toRaw', function(v) {
    return v ? v.toString() : v;
  });
});

Z.Model.registerAttrType('string', Z.StringAttr);

Z.NumberAttr = Z.BaseAttr.extend(function() {
  this.def('toRaw', function(v) {
    if (typeof v === 'string') { return parseFloat(v, 10); }
    else if (typeof v === 'number') { return v; }
    else { return null; }
  });
});

Z.Model.registerAttrType('number', Z.NumberAttr);

Z.BooleanAttr = Z.BaseAttr.extend(function() {
  this.def('toRaw', function(v) {
    return Z.isNull(v) ? v : !!v;
  });
});

Z.Model.registerAttrType('boolean', Z.BooleanAttr);

Z.DateAttr = Z.BaseAttr.extend(function() {
  this.def('toRaw', function(v) {
    var date = v, y, m, d;

    if (Z.isNull(v) || Z.isUndefined(v)) { return null; }

    if (typeof date === 'string') {
      date = this.fromRaw(date);

      if (!date) {
        throw new Error(Z.fmt("Z.DateAttr.toRaw: could not convert string `%@` to a Date", v));
      }
    }
    else if (typeof date === 'number') {
      date = new Date(date);
    }

    if (!(date instanceof Date)) {
      throw new Error(Z.fmt("Z.DateAttr.toRaw: %@ is not a Date", date));
    }

    y = date.getFullYear().toString();
    m = (date.getMonth() + 1).toString();
    d = date.getDate().toString();

    m = m.length === 1 ? '0' + m : m;
    d = d.length === 1 ? '0' + d : d;

    return y + '-' + m + '-' + d;
  });

  this.def('fromRaw', function(s) {
    var parts;

    if (typeof s !== 'string') { return null; }

    parts = s.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/);

    if (!parts) { return null; }

    return new Date(parseInt(parts[1], 10), parseInt(parts[2], 10) - 1, parseInt(parts[3], 10));
  });
});

Z.Model.registerAttrType('date', Z.DateAttr);

Z.ArrayAttr = Z.BaseAttr.extend(function() {
  this.def('init', function(opts) {
    if (opts && opts.itemType && !attrTypes[opts.itemType]) {
      throw new Error(Z.fmt("Z.ArrayAttr.init: unknown attribute type: `%@`", opts.itemType));
    }

    this.itemConverter = opts && opts.itemType ?
      attrTypes[opts.itemType].create(opts.itemOpts) : null;
  });

  this.def('toRaw', function(v) {
    var array = v, newArray, i, len;

    if (Z.isNull(array) || Z.isUndefined(array)) {
      return null;
    }
    if (Z.isA(array, Z.Array)) {
      array = array.toNative();
    }
    else if (Z.isArguments(array)) {
      array = slice.call(array);
    }
    else if (!Z.isArray(array)) {
      array = [array];
    }

    if (!this.itemConverter) { return array; }

    newArray = [];

    for (i = 0, len = array.length; i < len; i++) {
      newArray.push(this.itemConverter.toRaw(array[i]));
    }

    return newArray;
  });

  this.def('fromRaw', function(v) {
    var array, i, len;

    if (!v || !this.itemConverter) { return v; }

    array = [];
    for (i = 0, len = v.length; i < len; i++) {
      array.push(this.itemConverter.fromRaw(v[i]));
    }

    return array;
  });
});

Z.Model.registerAttrType('array', Z.ArrayAttr);

}());
