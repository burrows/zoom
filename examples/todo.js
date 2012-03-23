(function() {

App = {};

Z.addNamespace(App, 'App');

App.LocalStorageMapper = Z.Mapper.extend(function() {
  function nextId() {
    return localStorage['nextid'] ?
      localStorage['nextid'] = 1 + parseInt(localStorage['nextid']) :
      localStorage['nextid'] = 1;
  }

  function persistTag(tag) {
    var id = tag.id() || nextId(), k = 'tag:' + id;

    localStorage.setItem(k, JSON.stringify({
      id: id, name: tag.name()
    }));

    if (!tag.id()) { tag.id(id); }
  }

  function persistTodo(todo) {
    var id = todo.id() || nextId(), k = 'todo:' + id;

    todo.tags().invoke('save');

    localStorage.setItem(k, JSON.stringify({
      id: id,
      title: todo.title(),
      isDone: todo.isDone(),
      tags: todo.tags().pluck('id').toNative()
    }));

    if (!todo.id()) { todo.id(id); }
  }

  this.def('initialize', function() {
    var tags = [], todos = [], i, len, k, v;

    for (i = 0, len = localStorage.length; i < len; i++) {
      k = localStorage.key(i); v = localStorage.getItem(k);

      if      (k.match(/^tag:/))  { tags.push(JSON.parse(v)); }
      else if (k.match(/^todo:/)) { todos.push(JSON.parse(v)); }
    }

    for (i = 0, len = tags.length; i < len; i++) { App.Tag.load(tags[i]); }
    for (i = 0, len = todos.length; i < len; i++) { App.Todo.load(todos[i]); }
  });

  this.def('createModel', function(model) {
    (model.isA(App.Todo) ? persistTodo : persistTag)(model);
    model.createModelDidSucceed();
  });

  this.def('updateModel', function(model) {
    (model.isA(App.Todo) ? persistTodo : persistTag)(model);
    model.updateModelDidSucceed();
  });

  this.def('destroyModel', function(model) {
    var k = (model.isA(App.Todo) ? 'todo:' : 'tag:') + model.id();
    delete localStorage[k];
    model.destroyModelDidSucceed();
  });
});

App.Todo = Z.Model.extend(function() {
  this.attribute('isDone', 'boolean', {'default': false});
  this.attribute('title', 'string');
  this.hasMany('tags', 'App.Tag', {owner: true, inverse: 'todos'});

  this.registerValidator('validateTitle');

  this.def('validateTitle', function() {
    var title = this.title();

    if (!title || title.length === 0) {
      this.addError('title', 'title must be present');
    }
  });

});

App.Tag = Z.Model.extend(function() {
  this.attribute('name', 'string');
  this.hasMany('todos', 'App.Todo', {inverse: 'tags'});
});

Z.Model.mapper = App.LocalStorageMapper.create();

App.allTodos = App.Todo.query(function() { return true; });

// --

App.TitleView = Z.View.extend(function() {
  this.tag('h1');
  this.def('renderContent', function() { return 'Todos'; });
});

App.HelloView = Z.View.extend(function() {
  this.tag('p');
  this.def('renderContent', function() {
    return Z.fmt('Hello world! (%@)', this.objectId());
  });
});

App.GoodbyeView = Z.View.extend(function() {
  this.tag('p');
  this.def('renderContent', function() {
    return Z.fmt('Goodbye. (%@)', this.objectId());
  });
});

App.GreetingView = Z.View.extend(function() {
  this.subview('helloView', App.HelloView);
  this.subview('goodbyeView', App.GoodbyeView);
});

App.TodoView = Z.View.extend(function() {
  this.property('content');

  this.def('renderContent', function() {
    var todo = this.content();
    return Z.fmt('<span class="title">%@</span> (<span class="tags">%@</span>)',
                 todo.title(), todo.get('tags.name').join(', '));
  })
});

App.TodoListView = Z.ListView.extend(function() {
  this.itemView(App.TodoView);
});

App.MainView = Z.RootView.extend(function() {
  this.subview('titleView', App.TitleView);
  this.subview('todoListView', App.TodoListView);
});

App.mainView = App.MainView.create({container: $('#app')});

App.mainView.set('todoListView.items', App.allTodos);

App.mainView.display();

}());

