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

App.allTodos = App.Todo.query();

App.controller = {
  createTodo: function(title) {
    App.Todo.create({ title: title }).save();
    App.mainView.set('inputView.value', null);
  },

  updateIsDone: function(todo, isDone) {
    todo.isDone(isDone);
    todo.save();
  }
};

App.TitleView = Z.View.extend(function() {
  this.tag('h1');
  this.def('renderContent', function() { return 'Todos'; });
});

App.InputView = Z.View.extend(function() {
  this.property('value');

  this.def('didDisplay', function() {
    this.supr();
    this.observe('value', this, 'valueDidChange');
  });

  this.def('didRemove', function() {
    this.supr();
    this.stopObserving('value', this, 'valueDidChange');
  });

  this.def('renderContent', function() {
    return '<input type="text" placeholder="Enter a Todo" />';
  });

  this.def('handleKeyupEvent', function(evt) {
    var input = $(this.element()).find('input');
    this.value(input.val());
  });

  this.def('handleKeydownEvent', function(evt) {
    var key = evt.keyCode;

    if (key === 13) {
      App.controller.createTodo(this.value());
    }
  });

  this.def('valueDidChange', function() {
    var input = $(this.element()).find('input');
    input.val(this.value());
  });
});

App.TodoView = Z.View.extend(function() {
  this.property('content');

  this.def('didDisplay', function() {
    this.supr();
    this.observe('content.isDone', this, 'updateIsDone');
  });

  this.def('didRemove', function() {
    this.supr();
    this.stopObserving('content.isDone', this, 'updateIsDone');
  });

  this.def('renderContent', function() {
    var todo = this.content();
    return Z.fmt('<input type="checkbox" %@ /><span class="title">%@</span> (<span class="tags">%@</span>)',
                 todo.isDone() ? 'checked' : '', todo.title(), todo.get('tags.name').join(', '));
  });

  this.def('updateIsDone', function() {
    var input = $(this.element()).find('input');
    input.attr('checked', this.get('content.isDone') ? 'checked' : null);
  });

  this.def('handleClickEvent', function(evt) {
    var elem = $(evt.target);

    if (elem.is('input')) {
      App.controller.updateIsDone(this.content(), !!elem.attr('checked'));
    }
  })
});

App.TodoListView = Z.ListView.extend(function() {
  this.itemView(App.TodoView);
});

App.MainView = Z.RootView.extend(function() {
  this.subview('titleView', App.TitleView);
  this.subview('inputView', App.InputView);
  this.subview('todoListView', App.TodoListView);
});

App.mainView = App.MainView.create({container: $('#app')});

App.mainView.set('todoListView.items', App.allTodos);

App.mainView.display();

}());

