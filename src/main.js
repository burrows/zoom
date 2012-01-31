(function(undefined) {

if (typeof exports !== 'undefined') {
  Z = exports;
  Z.platform = 'node';
  Z.root = global;
}
else {
  Z = window.Z = {};
  Z.platform = 'browser';
  Z.root = window;
}

var slice = Array.prototype.slice, namespaces = [ [Z, 'Z'] ];

Z.addNamespace = function(o, name) { namespaces.push([o, name || '']); };

Z.removeNamespace = function(o) {
  namespaces = namespaces.filter(function(namespace) {
    return namespace[0] != o;
  });
};

Z.namespaces = function() { return slice.call(namespaces); };

}());

