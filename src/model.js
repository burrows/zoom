(function(undefined) {

var slice = Array.prototype.slice;

Z.Model = Z.Object.extend(function() {
  this.isZModel = true;

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

  this.def('initialize', function() {
    var associations = this.associationDescriptors(), association, k;

    this.supr.apply(this, slice.call(arguments));

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

  function hasManyAssociationDidChange(notification) {
    var name        = notification.context.name,
        previous    = notification.previous,
        current     = notification.current,
        association = this.associationDescriptorFor(name),
        inverse     = association.inverse,
        i, len;

    if (!inverse) { return; }

    if (current && !association.addingInverse) {
      for (i = 0, len = current.length(); i < len; i++) {
        current.at(i).inverseDidAdd(inverse, this);
      }
    }

    if (previous && !association.removingInverse) {
      for (i = 0, len = previous.length(); i < len; i++) {
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
});

}());
