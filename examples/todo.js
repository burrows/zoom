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
App.allTags  = App.Tag.query();

App.controller = {
  createTodo: function(title) {
    var tags, tag, m;

    if ((m = title.match(/\[([^\]]*)\]\s*$/))) {
      tags = Z.A(m[1].split(/\s*,\s*/)).map(function(name) {
        tag = App.allTags.find(function(t) { return t.name() === name; });
        return tag || App.Tag.create({name: name});
      });

      title = title.replace(/\s*\[[^\]]*\]\s*$/, '');
    }
    App.Todo.create({ title: title, tags: tags || Z.A() }).save();
    App.mainView.set('inputView.value', null);
  },

  deleteTodo: function(todo) {
    todo.destroy();
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
    this.observe('content.tags.@', this, 'updateTags');
  });

  this.def('didRemove', function() {
    this.supr();
    this.stopObserving('content.isDone', this, 'updateIsDone');
    this.stopObserving('content.tags.@', this, 'updateTags');
  });

  this.def('renderContent', function() {
    var todo = this.content(), tags = todo.tags();

    return Z.fmt('<input type="checkbox" %@ /><span class="title">%@</span> %@ <a href="#" class="delete">Delete</a>',
                 todo.isDone() ? 'checked' : '', todo.title(),
                 '<span class="tags">' + (tags.size() > 0 ? '[' + tags.get('name').join(', ') + ']' : '') + '</span>');
  });

  this.def('updateIsDone', function() {
    var input = $(this.element()).find('input');
    input.attr('checked', this.get('content.isDone') ? 'checked' : null);
  });

  this.def('updateTags', function() {
    var elem = $(this.element()).find('.tags'), tags = this.get('content.tags');
    elem.text(tags.size() > 0 ? '[' + tags.get('name').join(', ') + ']' : '');
  });

  this.def('handleClickEvent', function(evt) {
    var elem = $(evt.target);

    if (elem.is('input')) {
      App.controller.updateIsDone(this.content(), !!elem.attr('checked'));
    }
    else if (elem.is('a.delete')) {
      App.controller.deleteTodo(this.content());
    }
  })
});

App.TagView = Z.View.extend(function() {
  this.property('content');

  this.def('renderContent', function() {
    return this.get('content.name');
  });
});

App.TodoListView = Z.ListView.extend(function() {
  this.itemView(App.TodoView);
});

App.TagListView = Z.ListView.extend(function() {
  this.itemView(App.TagView);
});

App.MainView = Z.RootView.extend(function() {
  this.subview('titleView', App.TitleView);
  this.subview('inputView', App.InputView);
  this.subview('tagListView', App.TagListView);
  this.subview('todoListView', App.TodoListView);
});

App.mainView = App.MainView.create({container: $('#app')});

App.mainView.set('tagListView.items', App.allTags);
App.mainView.set('todoListView.items', App.allTodos);

App.mainView.display();

}());

