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
      tags = Z.A(m[1].split(/\s*,\s*/)).map(function(name) {
        tag = Todo.allTags.find(function(t) { return t.name() === name; });
        return tag || Todo.Tag.create({name: name});
      });

      title = title.replace(/\s*\[[^\]]*\]\s*$/, '');
    }

    todo = Todo.Todo.create({title: title, tags: tags || Z.A()}).save();

    Z.log(todo, todo.errors());

    Todo.rootView.set('mainView.inputView.value', null);
  },

  deleteTodo: function(todo) {
    todo.destroy();
  },

  updateIsDone: function(todo, isDone) {
    todo.isDone(isDone);
    todo.save();
  },

  selectTag: function(tag) {
    selectedTags.push(tag);
    this.filterTodos();
  },

  deselectTag: function(tag) {
    selectedTags.remove(tag);
    this.filterTodos();
  },

  filterTodos: function() {
    var oldQuery = Todo.rootView.get('mainView.todoListView.items'), newQuery;

    newQuery = selectedTags.size() === 0 ? Todo.allTodos : Todo.Todo.query({
      matchFn: function(todo) {
        if (todo.get('tags.size') === 0) { return false; }

        return selectedTags.all(function(tag) {
          return todo.tags().contains(tag);
        });
      }
    });

    if (oldQuery !== Todo.allTodos) { oldQuery.destroy(); }

    //Todo.rootView.set('mainView.todoListView.items', newQuery); 
  }
};

//------------------------------------------------------------------------------
// views
//------------------------------------------------------------------------------

//Todo.TagView = Z.View.extend(function() {
//  this.prop('content');
//  this.prop('isSelected', { def: false });
//  this.classes().push('tag-view');
//
//  this.def('didDisplay', function() {
//    this.supr();
//    this.observe('content.todos.size', this, 'updateNumTodos');
//    this.observe('isSelected', this, 'updateIsSelected');
//  });
//
//  this.def('didRemove', function() {
//    this.supr();
//    this.stopObserving('content.todos.size', this, 'updateNumTodos');
//    this.stopObserving('isSelected', this, 'updateIsSelected');
//  });
//
//  this.def('renderContent', function() {
//    return '<span class="badge">' + this.get('content.todos.size') + '</span> ' + this.get('content.name');
//  });
//
//  this.def('updateNumTodos', function() {
//    $(this.element()).find('span.badge').text(this.get('content.todos.size'));
//  });
//
//  this.def('updateIsSelected', function() {
//    $(this.element()).toggleClass('selected', this.isSelected());
//  });
//
//  this.def('handleClickEvent', function(evt) {
//    this.isSelected(!this.isSelected());
//
//    if (this.isSelected()) {
//      Todo.controller.selectTag(this.content());
//    }
//    else {
//      Todo.controller.deselectTag(this.content());
//    }
//  });
//});

Todo.TagView = Z.View.extend(function() {
  this.prop('content');
  this.def('render', function() {
    this.node().innerHTML = '<span class="badge">' +
      this.get('content.todos.size') + '</span> ' + this.get('content.name');
  });
});

Todo.TagListView = Z.ListView.extend(function() {
  this.def('itemViewType', function() { return Todo.TagView; });
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

  this.def('displayPaths', function() { return this.supr().concat('value'); });

  this.def('render', function() {
    var value = this.value();
    this.node().innerHTML = Z.fmt('<input type="text" placeholder="Enter a Todo" value="%@"/>', value);
  });

  //this.def('handleKeyupEvent', function(evt) {
  //  var input = $(this.element()).find('input'),
  //      val   = input.val();

  //  if (val !== this.value()) { this.value(input.val()); }
  //});

  //this.def('handleKeydownEvent', function(evt) {
  //  var key = evt.keyCode;

  //  if (key === 13) {
  //    Todo.controller.createTodo(this.value());
  //  }
  //});
});
//
//Todo.TodoView = Z.View.extend(function() {
//  this.prop('content');
//  this.classes().push('todo-view');
//
//  this.def('didDisplay', function() {
//    this.supr();
//    this.observe('content.isDone', this, 'updateIsDone');
//    this.observe('content.tags.@', this, 'updateTags');
//  });
//
//  this.def('didRemove', function() {
//    this.supr();
//    this.stopObserving('content.isDone', this, 'updateIsDone');
//    this.stopObserving('content.tags.@', this, 'updateTags');
//  });
//
//  this.def('renderContent', function() {
//    var todo = this.content();
//
//    return [
//      Z.fmt('<td><input type="checkbox" %@ /></td>', todo.isDone() ? 'checked' : ''),
//      Z.fmt('<td class="title%@">%@</td>', todo.isDone() ? ' done' : '', todo.title()),
//      Z.fmt('<td class="tags">%@</td>', this.renderTags()),
//      '<td><i class="icon-remove-sign"></i></td>'
//    ].join('');
//  });
//
//  this.def('renderTags', function() {
//    return this.get('content.tags').map(function(tag) {
//      return '<span class="label label-info">' + tag.name() + '</span>';
//    }).join('')
//  });
//
//  this.def('updateIsDone', function() {
//    var elem   = $(this.element()),
//        input  = elem.find('input'),
//        title  = elem.find('.title'),
//        isDone = this.get('content.isDone');
//
//    if (isDone) {
//      input.attr('checked', 'checked');
//      title.addClass('done');
//    }
//    else {
//      input.attr('checked', null);
//      title.removeClass('done');
//    }
//  });
//
//  this.def('updateTags', function() {
//    var elem = $(this.element()).find('.tags');
//    elem.text(this.renderTags());
//  });
//
//  this.def('handleClickEvent', function(evt) {
//    var elem = $(evt.target);
//
//    if (elem.is('input')) {
//      Todo.controller.updateIsDone(this.content(), !!elem.attr('checked'));
//    }
//    else if (elem.is('i.icon-remove-sign')) {
//      Todo.controller.deleteTodo(this.content());
//    }
//  })
//});
//
//Todo.TodoListView = Z.ListView.extend(function() {
//  this.classes().push('table', 'table-striped');
//  this.tag('table');
//  this.itemTag('tr');
//  this.itemView(Todo.TodoView);
//});

Todo.ContentView = Z.View.extend(function() {
  this.subview('inputView', Todo.InputView);
  //this.subview('todoListView', Todo.TodoListView);
});

Todo.MainView = Z.View.extend(function() {
  this.subview('sidebarView', Todo.SidebarView);
  this.subview('contentView', Todo.ContentView);
});

document.addEventListener('DOMContentLoaded', function() {
  Todo.app = Z.App.create(Todo.MainView, document.getElementById('app'));

  Todo.app.set('mainWindow.contentView.sidebarView.tagListView.content', Todo.allTags);
  
  Todo.app.start();
});

}());

