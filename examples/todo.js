(function() {

App = {};

Z.addNamespace(App, 'App');

App.LocalStorageMapper = Z.Mapper.extend(function() {
  function nextId() {
    if (!localStorage['nextid']) {
      localStorage['nextid'] = 1;
    }
    else {
      localStorage['nextid'] = parseInt(localStorage['nextid']) + 1;
    }

    return parseInt(localStorage['nextid']);
  }

  function createTag(tag) {
    var id = nextId(), k = 'tag:' + id;

    localStorage.setItem(k, JSON.stringify({
      id: id, name: tag.name()
    }));

    tag.id(id);
  }

  function updateTag(tag) {
    var id = tag.id(), k = 'tag:' + id;

    localStorage.setItem(k, JSON.stringify({
      id: id, name: tag.name()
    }));
  }

  function createTodo(todo) {
    var id = nextId(), k = 'todo:' + id;

    localStorage.setItem(k, JSON.stringify({
      id: id, title: todo.title(), tags: todo.tags().pluck('id').toNative()
    }));

    todo.id(id);
  }

  function updateTodo(todo) {
    var id = todo.id(), k = 'todo:' + id;

    localStorage.setItem(k, JSON.stringify({
      id: id, title: todo.title(), tags: todo.tags.pluck('id').toNative()
    }));
  }

  this.def('initialize', function() {
    var tags = [], todos = [], i, len, k, v;

    for (i = 0, len = localStorage.length; i < len; i++) {
      k = localStorage.key(i);
      v = localStorage.getItem(k);

      if (k.match(/^tag:/)) {
        tags.push(JSON.parse(v));
      }
      else if (k.match(/^todo:/)) {
        todos.push(JSON.parse(v));
      }
    }

    for (i = 0, len = tags.length; i < len; i++) {
      App.Tag.load(tags[i]);
    }

    for (i = 0, len = todos.length; i < len; i++) {
      App.Todo.load(todos[i]);
    }
  });

  this.def('fetchModel', function(model) {
  });

  this.def('createModel', function(model) {
    if (model.isA(App.Tag)) {
      createTag(model);
    }
    else if (model.isA(App.Todo)) {
      model.tags().invoke('save');
      createTodo(model);
    }

    model.createModelDidSucceed();
  });

  this.def('updateModel', function(model) {
    if (model.isA(App.Tag)) {
      updateTag(model);
    }
    else if (model.isA(App.Todo)) {
      model.tags().invoke('save');
      updateTodo(model);
    }

    model.updateModelDidSucceed();
  });

  this.def('destroyModel', function(model) {
  });
});

App.Todo = Z.Model.extend(function() {
  //this.attribute('isDone', 'boolean', {'default': false});
  this.attribute('title', 'string');
  this.hasMany('tags', 'App.Tag', {owner: true, inverse: 'todos'});
});

App.Tag = Z.Model.extend(function() {
  this.attribute('name', 'string');
  this.hasMany('todos', 'App.Todo', {inverse: 'tags'});
});

Z.Model.mapper = App.LocalStorageMapper.create();

App.allTodos = App.Todo.query(function() { return true; });

}());
