(function(undefined) {

var slice = Array.prototype.slice;

Z.Model = Z.Object.extend(function() {
  var attributeTypes = {}, identityMap = {}, NEW, DIRTY, INVALID, BUSY;

  this.isZModel = true;

  this.mapper = Z.Mapper.create();

  // Model state bits
  this.NEW       = NEW       = 1;
  this.DIRTY     = DIRTY     = 2;
  this.INVALID   = INVALID   = 4;
  this.BUSY      = BUSY      = 8;
  this.DESTROYED = DESTROYED = 16;

  this.property('id', {
    set: function(v) {
      if (this.hasOwnProperty('__id__')) {
        throw new Error(Z.fmt("Z.Model.id (setter): overwriting a model's identity is not allowed: %@", this));
      }

      return this.__id__ = v;
    }
  });

  this.property('state', { readonly: true });

  this.def('stateString', function() {
    var state = this.state(), a;

    if (state & DESTROYED) {
      return state & BUSY ? 'DESTROYED-BUSY' : 'DESTROYED';
    }

    a = [];

    if (state & NEW) {
      a.push('NEW');
    }
    else {
      a.push('LOADED');
      a.push(state & DIRTY ? 'DIRTY' : 'CLEAN');
    }

    a.push(state & INVALID ? 'INVALID' : 'VALID');
    a.push(state & BUSY ? 'BUSY' : 'READY');

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
        var state = this.__state__;

        if (!(state & NEW) && !(state & DIRTY)) {
          setStateBit(this, DIRTY);
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

    setState(model, 0);

    return model;
  });

  this.def('fetch', function(id) {
    var model = retrieveFromIdentityMap(this, id);

    if (!model) {
      model = this.create({id: id});
      setState(model, BUSY);
      this.mapper.fetchModel(this, id);
    }

    return model;
  });

  this.def('fetchModelDidFail', function(id) {
    var model = retrieveFromIdentityMap(this, id);

    if (!model) {
      throw new Error('Z.Model.fetchModelDidFail: no object exists with id ' + id);
    }

    unsetStateBit(model, BUSY);
  });

  this.def('save', function() {
    var state = this.state();

    if (state & BUSY) {
      throw new Error(Z.fmt("Z.Model.save: attempted to save a BUSY model"));
    }

    if (state & DESTROYED) {
      throw new Error(Z.fmt("Z.Model.save: attempted to save a DESTROYED model"));
    }

    if (state & NEW) {
      setStateBit(this, BUSY);
      this.mapper.createModel(this);
    }
    else if (state & DIRTY) {
      setStateBit(this, BUSY);
      this.mapper.updateModel(this);
    }

    return this;
  });

  this.def('destroy', function() {
    setState(this, DESTROYED | BUSY);
    this.mapper.destroyModel(this);
    return this;
  });

  this.def('destroyModelDidSucceed', function() {
    unsetStateBit(this, BUSY);
  });

  this.def('toJSON', function() {
    var attrs = this.attributeNames(), o = {}, i, len;

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

    this.__state__ = NEW;

    this.supr.apply(this, slice.call(arguments));

    if (attributes && attributes.hasOwnProperty('id')) {
      addToIdentityMap(this);
    }
    else { this.observe('id', this, didSetIdentity); }

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

  function setState(m, state) {
    m.willChangeProperty('state');
    m.__state__ = state;
    m.didChangeProperty('state');
  }

  function setStateBit(m, bit) {
    m.willChangeProperty('state');
    m.__state__ = m.__state__ | bit;
    m.didChangeProperty('state');
  }

  function unsetStateBit(m, bit) {
    m.willChangeProperty('state');
    m.__state__ = m.__state__ & (~bit & 0xff);
    m.didChangeProperty('state');
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

  function didSetIdentity(notification) {
    addToIdentityMap(notification.observee);
    this.stopObserving('id', this, didSetIdentity);
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
