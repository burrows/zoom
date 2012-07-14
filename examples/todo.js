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

  this.prop('isSelected', {def: false});
});

Z.Model.mapper = Todo.LocalStorageMapper.create();

Todo.allTodos = Todo.Todo.query();
Todo.allTags  = Todo.Tag.query({orderBy: 'todos.size', isDescending: true});

//------------------------------------------------------------------------------
// controller
//------------------------------------------------------------------------------

var selectedTags = Z.A();

Todo.controller = {
  createTodo: function(title) {
    var todo, tags, tag, m;

    if ((m = title.match(/\[([^\]]*)\]\s*$/))) {
      tags = Z.Array.create(m[1].split(/\s*,\s*/)).map(function(name) {
        tag = Todo.allTags.find(function(t) { return t.name() === name; });
        return tag || Todo.Tag.create({name: name});
      });

      title = title.replace(/\s*\[[^\]]*\]\s*$/, '');
    }

    todo = Todo.Todo.create({title: title, tags: tags || Z.A()}).save();

    Z.log(todo, todo.errors());

    Todo.app.set('mainWindow.contentView.contentView.inputView.value', null)
  },

  deleteTodo: function(todo) {
    todo.destroy();
  },

  toggleIsDone: function(todo) {
    todo.isDone(!todo.isDone());
    todo.save();
  },

  toggleTagSelection: function(tag) {
    if (selectedTags.contains(tag)) {
      tag.isSelected(false);
      selectedTags.remove(tag);
    }
    else {
      tag.isSelected(true);
      selectedTags.push(tag);
    }
    this.filterTodos();
  },

  filterTodos: function() {
    var todoListView = Todo.app.get('mainWindow.contentView.contentView.todoListView'),
        oldQuery     = todoListView.content(),
        newQuery;

    newQuery = selectedTags.size() === 0 ? Todo.allTodos : Todo.Todo.query({
      matchFn: function(todo) {
        if (todo.get('tags.size') === 0) { return false; }

        return selectedTags.all(function(tag) {
          return todo.tags().contains(tag);
        });
      }
    });

    if (oldQuery !== Todo.allTodos) { oldQuery.destroy(); }

    todoListView.content(newQuery);
  }
};

//------------------------------------------------------------------------------
// views
//------------------------------------------------------------------------------

Todo.TagView = Z.View.extend(function() {
  this.prop('content');

  this.def('tag', function() { return 'li'; });

  this.def('displayPaths', function() {
    return this.supr().concat('content.isSelected');
  });

  this.def('render', function() {
    var node = this.node(),
        isSelected = this.get('content.isSelected'),
        badgeClasses = ['badge'];

     if (isSelected) { badgeClasses.push('badge-info'); }

    node.innerHTML = Z.fmt('<span class="%@">', badgeClasses.join(' ')) +
      this.get('content.todos.size') + '</span> ' + this.get('content.name');
  });

  this.def('mouseDown', function(e) {
    Todo.controller.toggleTagSelection(this.content());
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
    this.def('tag', function() { return 'legend'; });
    this.def('render', function() { this.node().innerHTML = 'Tags'; });
  }));

  this.subview('tagListView', Todo.TagListView);
});

Todo.InputView = Z.View.extend(function() {
  this.prop('value');

  this.def('displayPaths', function() {  return this.supr().concat('value'); });

  this.def('acceptsKeyView', function() { return true; });

  this.def('render', function() {
    var value = this.value(), node = this.node(), input;

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
    var input = this.node().firstChild;
    if (input && document.activeElement !== input) { input.focus(); }
    if (e.key() === 13) { Todo.controller.createTodo(this.value()); }
    return true;
  });

  this.def('keyUp', function(e) {
    var input = this.node().firstChild;
    if (input) { this.value(input.value); }
    return true;
  });
});

Todo.TodoView = Z.View.extend(function() {
  this.prop('content');

  this.def('tag', function() { return 'tr'; });

  this.def('classes', function() {
    return this.supr().concat('todo-view');
  });

  this.def('displayPaths', function() {
    return this.supr().concat('content.isDone', 'content.tags.@');
  });

  this.def('render', function() {
    var node = this.node(), todo = this.content(), tags;

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
    var elem = e.node();

    if (elem.nodeName === 'INPUT') {
      Todo.controller.toggleIsDone(this.content());
    }
    else if (elem.className.match(/\bicon-remove-sign\b/)) {
      Todo.controller.deleteTodo(this.content());
    }
  });
});

Todo.TodoListView = Z.ListView.extend(function() {
  this.def('classes', function() {
    return this.supr().concat('table', 'table-striped');
  });
  this.def('tag', function() { return 'table'; });
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

document.addEventListener('DOMContentLoaded', function() {
  Todo.app = Z.App.create(Todo.MainView, document.getElementById('app'));
  Todo.app.set('mainWindow.contentView.sidebarView.tagListView.content', Todo.allTags);
  Todo.app.set('mainWindow.contentView.contentView.todoListView.content', Todo.allTodos);
  Todo.app.start();
});

}());

