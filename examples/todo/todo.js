(function() {

Todo = {};

Z.addNamespace(Todo, 'Todo');

//------------------------------------------------------------------------------
// mapper
//------------------------------------------------------------------------------

Todo.LocalStorageMapper = Z.Mapper.extend(function() {
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

    todo.tags().each('save');

    localStorage.setItem(k, JSON.stringify({
      id: id,
      title: todo.title(),
      isDone: todo.isDone(),
      tags: todo.tags().pluck('id').toNative()
    }));

    if (!todo.id()) { todo.id(id); }
  }

  this.def('init', function() {
    var tags = [], todos = [], i, len, k, v;

    for (i = 0, len = localStorage.length; i < len; i++) {
      k = localStorage.key(i); v = localStorage.getItem(k);

      if      (k.match(/^tag:/))  { tags.push(JSON.parse(v)); }
      else if (k.match(/^todo:/)) { todos.push(JSON.parse(v)); }
    }

    for (i = 0, len = tags.length; i < len; i++) { Todo.Tag.load(tags[i]); }
    for (i = 0, len = todos.length; i < len; i++) { Todo.Todo.load(todos[i]); }
  });

  this.def('createModel', function(model) {
    (model.isA(Todo.Todo) ? persistTodo : persistTag)(model);
    model.createModelDidSucceed();
  });

  this.def('updateModel', function(model) {
    (model.isA(Todo.Todo) ? persistTodo : persistTag)(model);
    model.updateModelDidSucceed();
  });

  this.def('destroyModel', function(model) {
    var k = (model.isA(Todo.Todo) ? 'todo:' : 'tag:') + model.id();
    delete localStorage[k];
    model.destroyModelDidSucceed();
  });
});

//------------------------------------------------------------------------------
// models
//------------------------------------------------------------------------------

Todo.Todo = Z.Model.extend(function() {
  this.attr('isDone', 'boolean', {def: false});
  this.attr('title', 'string');
  this.hasMany('tags', 'Todo.Tag', {owner: true, inverse: 'todos'});

  this.registerValidator('validateTitle');

  this.def('validateTitle', function() {
    var title = this.title().replace(/(?:^\s*)|(?:\s*$)/g, ''); ;

    if (!title || title.length === 0) {
      this.addError('title', 'title must be present');
    }
  });

});

Todo.Tag = Z.Model.extend(function() {
  this.attr('name', 'string');
  this.hasMany('todos', 'Todo.Todo', {inverse: 'tags'});
});

Z.Model.mapper = Todo.LocalStorageMapper.create();

//------------------------------------------------------------------------------
// controllers
//------------------------------------------------------------------------------

Todo.tagsController = Z.ArrayController.extend(function() {
  this.allowsMultipleSelection(true);

  this.compareFn(function(a, b) {
    return Z.cmp(b.get('todos.size'), a.get('todos.size'));
  });

  this.def('init', function(props) {
    this.supr(props);
    this.on('didChange:content.todos.size', 'rearrange');
  });
}).create();

Todo.todosController = Z.ArrayController.extend(function() {
  this.prop('query');
  this.prop('selectedTags');

  this.filterFn(function(todo) {
    var tags = this.selectedTags();
    if (!tags || tags.size() === 0) { return true; }
    if (todo.get('tags.size') === 0) { return false; }
    return tags.all(function(tag) { return todo.tags().contains(tag); });
  });

  this.def('init', function(props) {
    this.supr(props);
    this.on('didChange:selectedTags.@', 'rearrange');
  });

  this.def('createTodo', function(title) {
    var todo, tags, tag;

    tags = Z.Array.create(title.match(/#\w+/g) || []).map(function(name) {
      name = name.replace('#', '');
      tag = Todo.Tag.all().find(function(t) { return t.name() === name; });
      return tag || Todo.Tag.create({name: name});
    });

    title = title.replace(/#\w+/g, '').replace(/^\s+|\s+$/g, '')

    todo = Todo.Todo.create({title: title, tags: tags || Z.A()})
    todo.save();

    Z.log(todo, todo.errors());

    Todo.app.set('mainWindow.mainView.contentView.inputView.value', null)
  });

  this.def('deleteTodo', function(todo) { todo.destroy(); });

  this.def('toggleIsDone', function(todo) {
    todo.isDone(!todo.isDone());
    todo.save();
  });
}).create();

//------------------------------------------------------------------------------
// views
//------------------------------------------------------------------------------

Todo.TagView = Z.View.extend(function() {
  this.tag = 'li';

  this.prop('content');
  this.prop('isSelected');

  this.def('displayPaths', function() {
    return this.supr().concat('isSelected');
  });

  this.def('render', function() {
    var isSelected = this.get('isSelected'),
        badgeClasses = ['badge'];

     if (isSelected) { badgeClasses.push('badge-info'); }

    this.node.innerHTML = Z.fmt('<span class="%@">', badgeClasses.join(' ')) +
      this.get('content.todos.size') + '</span> ' + this.get('content.name');
  });

  this.def('mouseDown', function(e) {
    var action = this.isSelected() ? 'didUnselectTag' : 'didSelectTag';
    this.send(action, this.content());
  });
});

Todo.TagListView = Z.ListView.extend(function() {
  this.def('itemViewType', function() { return Todo.TagView; });
  this.def('classes', function() {
    return this.supr().concat('tag-list-view');
  });
});

Todo.SidebarView = Z.View.extend(function() {
  this.def('classes', function() { return this.supr().concat('span4'); });

  this.subview('headerView', Z.View.extend(function() {
    this.tag = 'legend';
    this.def('render', function() { this.node.innerHTML = 'Tags'; });
  }));

  this.subview('tagListView', Todo.TagListView);
});

Todo.InputView = Z.View.extend(function() {
  this.prop('value');

  this.def('displayPaths', function() {  return this.supr().concat('value'); });

  this.def('acceptsKeyView', function() { return true; });

  this.def('render', function() {
    var value = this.value(), node = this.node, input;

    if (!node.hasChildNodes()) {
      node.innerHTML = '<input type="text" placeholder="Enter a Todo"/>';
    }

    input = node.firstChild;
    if (input.value !== value) { input.value = value; }

    if (this.isKey()) {
      if (document.activeElement !== input) { input.focus(); }
    }
  });

  this.def('keyDown', function(e) {
    var input = this.node.firstChild;
    if (input && document.activeElement !== input) { input.focus(); }
    if (e.key === 13) { this.send('didCreateTodo', this.value()); }
    return true;
  });

  this.def('keyUp', function(e) {
    var input = this.node.firstChild;
    if (input) { this.value(input.value); }
    return true;
  });
});

Todo.TodoView = Z.View.extend(function() {
  this.tag = 'tr';

  this.prop('content');

  this.def('classes', function() {
    return this.supr().concat('todo-view');
  });

  this.def('displayPaths', function() {
    return this.supr().concat('content.isDone', 'content.tags.@');
  });

  this.def('render', function() {
    var node = this.node, todo = this.content(), tags;

    tags = todo.tags().map(function(tag) {
      return '<span class="label label-info">' + tag.name() + '</span>';
    }).join('')

    node.innerHTML = [
      Z.fmt('<td><input type="checkbox" %@ /></td>', todo.isDone() ? 'checked' : ''),
      Z.fmt('<td class="title%@">%@</td>', todo.isDone() ? ' done' : '', todo.title()),
      Z.fmt('<td class="tags">%@</td>', tags),
      '<td><i class="icon-remove-sign"></i></td>'
    ].join('');
  });

  this.def('mouseDown', function(e) {
    var elem = e.node;

    if (elem.nodeName === 'INPUT') {
      this.send('didToggleIsDone', this.content());
    }
    else if (elem.className.match(/\bicon-remove-sign\b/)) {
      this.send('didDeleteTodo', this.content());
    }
  });
});

Todo.TodoListView = Z.ListView.extend(function() {
  this.tag  = 'table';
  this.def('classes', function() {
    return this.supr().concat('table', 'table-striped');
  });
  this.def('itemViewType', function() { return Todo.TodoView; });
});

Todo.ContentView = Z.View.extend(function() {
  this.def('classes', function() {
    return this.supr().concat('span8');
  });
  this.subview('inputView', Todo.InputView);
  this.subview('todoListView', Todo.TodoListView);
});

Todo.MainView = Z.View.extend(function() {
  this.def('classes', function() {
    return this.supr().concat('row');
  });
  this.subview('sidebarView', Todo.SidebarView);
  this.subview('contentView', Todo.ContentView);
});

Todo.app = Z.App.create(Todo.MainView).open(function() {
  this.def('didSelectTag', function(tag) {
    Todo.tagsController.selectItem(tag);
    Todo.todosController.selectedTags(Todo.tagsController.selection());
  });

  this.def('didUnselectTag', function(tag) {
    Todo.tagsController.unselectItem(tag);
    Todo.todosController.selectedTags(Todo.tagsController.selection());
  });

  this.def('didCreateTodo', function(todo) {
    Todo.todosController.createTodo(todo);
  });

  this.def('didToggleIsDone', function(todo) {
    Todo.todosController.toggleIsDone(todo);
  });

  this.def('didDeleteTodo', function(todo) {
    Todo.todosController.deleteTodo(todo);
  });
});

document.addEventListener('DOMContentLoaded', function() {
  Todo.tagsController.content(Todo.Tag.all());
  Todo.todosController.content(Todo.Todo.all());

  Todo.app.set('mainWindow.mainView.sidebarView.tagListView.content',
    Todo.tagsController.arranged());
  Todo.app.set('mainWindow.mainView.sidebarView.tagListView.selectionIndexes',
    Todo.tagsController.selectionIndexes());
  Todo.app.set('mainWindow.mainView.contentView.todoListView.content',
    Todo.todosController.arranged());

  Todo.app.start(document.getElementById('app'));
});

}());

