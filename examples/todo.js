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

App.TodoView = Z.Object.extend(function() {
  this.property('todo');

  this.def('initialize', function(props) {
    this.supr(props);
    this.observe('todo.title', this, 'update');
    this.observe('todo.tags.name', this, 'update');
  });

  this.def('render', function() {
    var todo = this.todo();

    return Z.fmt('<li id="todo-%@" class="todo-item"><span class="title">%@</span> (<span class="tags">%@</span>)</li>',
                 todo.id(), todo.title(), todo.get('tags.name').join(', '));
  });

  this.def('update', function(notification) {
    var todo = this.todo(), elem = $('#todo-' + todo.id());

    if (notification.path === 'todo.title') {
      elem.find('.title').text(todo.title());
    }
    else if (notification.path === 'todo.tags.name') {
      console.log('here:', todo.get('tags.name'));
      elem.find('.tags').text(todo.get('tags.name').join(', '));
    }
  });

  this.def('destroy', function() {
    this.stopObserving('todo.title', this, 'update');
    this.stopObserving('todo.tags.name', this, 'update');
  });
});

App.TodoListView = Z.Object.extend(function() {
  this.property('elem');
  this.property('todos');
  this.property('childViews');

  this.def('initialize', function(props) {
    this.supr(props);
    this.childViews(Z.A());

    this.observe('todos.@', this, 'render', { fire: true });
  });

  this.def('render', function() {
    var todos = this.todos(), childViews = this.childViews(), html;

    childViews.invoke('destroy');
    childViews.clear();

    html = '<ul class="todo-list">';

    todos.each(function(todo) {
      todoView = App.TodoView.create({todo: todo});
      html += todoView.render();
      childViews.push(todoView);
    });

    html += '</ul>';

    return this.elem().html(html);
  });
});

App.TodoListView.create({elem: $('#app'), todos: App.allTodos});

}());

