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

