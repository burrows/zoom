(function() {

Todo = {};

Z.addNamespace(Todo, 'Todo');

//------------------------------------------------------------------------------
// mapper
//------------------------------------------------------------------------------

//App.LocalStorageMapper = Z.Mapper.extend(function() {
//  function nextId() {
//    return localStorage['nextid'] ?
//      localStorage['nextid'] = 1 + parseInt(localStorage['nextid']) :
//      localStorage['nextid'] = 1;
//  }
//
//  function persistTag(tag) {
//    var id = tag.id() || nextId(), k = 'tag:' + id;
//
//    localStorage.setItem(k, JSON.stringify({
//      id: id, name: tag.name()
//    }));
//
//    if (!tag.id()) { tag.id(id); }
//  }
//
//  function persistTodo(todo) {
//    var id = todo.id() || nextId(), k = 'todo:' + id;
//
//    todo.tags().invoke('save');
//
//    localStorage.setItem(k, JSON.stringify({
//      id: id,
//      title: todo.title(),
//      isDone: todo.isDone(),
//      tags: todo.tags().pluck('id').toNative()
//    }));
//
//    if (!todo.id()) { todo.id(id); }
//  }
//
//  this.def('initialize', function() {
//    var tags = [], todos = [], i, len, k, v;
//
//    for (i = 0, len = localStorage.length; i < len; i++) {
//      k = localStorage.key(i); v = localStorage.getItem(k);
//
//      if      (k.match(/^tag:/))  { tags.push(JSON.parse(v)); }
//      else if (k.match(/^todo:/)) { todos.push(JSON.parse(v)); }
//    }
//
//    for (i = 0, len = tags.length; i < len; i++) { App.Tag.load(tags[i]); }
//    for (i = 0, len = todos.length; i < len; i++) { App.Todo.load(todos[i]); }
//  });
//
//  this.def('createModel', function(model) {
//    (model.isA(App.Todo) ? persistTodo : persistTag)(model);
//    model.createModelDidSucceed();
//  });
//
//  this.def('updateModel', function(model) {
//    (model.isA(App.Todo) ? persistTodo : persistTag)(model);
//    model.updateModelDidSucceed();
//  });
//
//  this.def('destroyModel', function(model) {
//    var k = (model.isA(App.Todo) ? 'todo:' : 'tag:') + model.id();
//    delete localStorage[k];
//    model.destroyModelDidSucceed();
//  });
//});
//
////------------------------------------------------------------------------------
//// models
////------------------------------------------------------------------------------
//
//App.Todo = Z.Model.extend(function() {
//  this.attribute('isDone', 'boolean', {def: false});
//  this.attribute('title', 'string');
//  this.hasMany('tags', 'App.Tag', {owner: true, inverse: 'todos'});
//
//  this.registerValidator('validateTitle');
//
//  this.def('validateTitle', function() {
//    var title = this.title().replace(/(?:^\s*)|(?:\s*$)/g, ''); ;
//
//    if (!title || title.length === 0) {
//      this.addError('title', 'title must be present');
//    }
//  });
//
//});
//
//App.Tag = Z.Model.extend(function() {
//  this.attribute('name', 'string');
//  this.hasMany('todos', 'App.Todo', {inverse: 'tags'});
//});
//
//Z.Model.mapper = App.LocalStorageMapper.create();
//
//App.allTodos = App.Todo.query();
//App.allTags  = App.Tag.query({orderBy: 'todos.size', isDescending: true});
//
////------------------------------------------------------------------------------
//// controller
////------------------------------------------------------------------------------
//
//var selectedTags = Z.A();
//
//App.controller = {
//  createTodo: function(title) {
//    var todo, tags, tag, m;
//
//    if ((m = title.match(/\[([^\]]*)\]\s*$/))) {
//      tags = Z.A(m[1].split(/\s*,\s*/)).map(function(name) {
//        tag = App.allTags.find(function(t) { return t.name() === name; });
//        return tag || App.Tag.create({name: name});
//      });
//
//      title = title.replace(/\s*\[[^\]]*\]\s*$/, '');
//    }
//
//    todo = App.Todo.create({ title: title, tags: tags || Z.A() }).save();
//
//    Z.log(todo, todo.errors());
//
//    App.rootView.set('mainView.inputView.value', null);
//  },
//
//  deleteTodo: function(todo) {
//    todo.destroy();
//  },
//
//  updateIsDone: function(todo, isDone) {
//    todo.isDone(isDone);
//    todo.save();
//  },
//
//  selectTag: function(tag) {
//    selectedTags.push(tag);
//    this.filterTodos();
//  },
//
//  deselectTag: function(tag) {
//    selectedTags.remove(tag);
//    this.filterTodos();
//  },
//
//  filterTodos: function() {
//    var oldQuery = App.rootView.get('mainView.todoListView.items'), newQuery;
//
//    newQuery = selectedTags.size() === 0 ? App.allTodos : App.Todo.query({
//      matchFn: function(todo) {
//        if (todo.get('tags.size') === 0) { return false; }
//
//        return selectedTags.all(function(tag) {
//          return todo.tags().contains(tag);
//        });
//      }
//    });
//
//    if (oldQuery !== App.allTodos) { oldQuery.destroy(); }
//
//    App.rootView.set('mainView.todoListView.items', newQuery); 
//  }
//};
//
////------------------------------------------------------------------------------
//// views
////------------------------------------------------------------------------------
//
//App.TagView = Z.View.extend(function() {
//  this.property('content');
//  this.property('isSelected', { def: false });
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
//      App.controller.selectTag(this.content());
//    }
//    else {
//      App.controller.deselectTag(this.content());
//    }
//  });
//});
//
//App.TagListView = Z.ListView.extend(function() {
//  this.classes().push('tag-list-view');
//  this.itemView(App.TagView);
//});
//
//App.SidebarView = Z.View.extend(function() {
//  this.classes().push('span4');
//  this.subview('headerView', Z.View.extend(function() {
//    this.tag('legend');
//    this.def('renderContent', function() {
//      return 'Tags';
//    });
//  }));
//  this.subview('tagListView', App.TagListView);
//});
//
//App.InputView = Z.View.extend(function() {
//  this.property('value');
//
//  this.def('didDisplay', function() {
//    this.supr();
//    this.observe('value', this, 'valueDidChange');
//  });
//
//  this.def('didRemove', function() {
//    this.supr();
//    this.stopObserving('value', this, 'valueDidChange');
//  });
//
//  this.def('renderContent', function() {
//    return '<input type="text" placeholder="Enter a Todo" />';
//  });
//
//  this.def('handleKeyupEvent', function(evt) {
//    var input = $(this.element()).find('input'),
//        val   = input.val();
//
//    if (val !== this.value()) { this.value(input.val()); }
//  });
//
//  this.def('handleKeydownEvent', function(evt) {
//    var key = evt.keyCode;
//
//    if (key === 13) {
//      App.controller.createTodo(this.value());
//    }
//  });
//
//  this.def('valueDidChange', function() {
//    var input = $(this.element()).find('input');
//    input.val(this.value());
//  });
//});
//
//App.TodoView = Z.View.extend(function() {
//  this.property('content');
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
//      App.controller.updateIsDone(this.content(), !!elem.attr('checked'));
//    }
//    else if (elem.is('i.icon-remove-sign')) {
//      App.controller.deleteTodo(this.content());
//    }
//  })
//});
//
//App.TodoListView = Z.ListView.extend(function() {
//  this.classes().push('table', 'table-striped');
//  this.tag('table');
//  this.itemTag('tr');
//  this.itemView(App.TodoView);
//});
//
//App.MainView = Z.View.extend(function() {
//  this.classes().push('span8');
//  this.subview('inputView', App.InputView);
//  this.subview('todoListView', App.TodoListView);
//});
//
//App.RootView = Z.RootView.extend(function() {
//  this.classes().push('row');
//
//  this.subview('sidebarView', App.SidebarView);
//  this.subview('mainView', App.MainView);
//});
//
//App.rootView = App.RootView.create({container: $('#app')});
//
//App.rootView.set('sidebarView.tagListView.items', App.allTags);
//App.rootView.set('mainView.todoListView.items', App.allTodos);
//
//App.rootView.display();

Todo.MainView = Z.DOMView.extend(function() {
  this.tag('h1');
  this.def('draw', function() {
    this.context().text('Hello world!');
  });
});

$(function() {
  Todo.app = Z.DOMApp.create({
    container: $('#app'), mainView: Todo.MainView
  }).start();
});

}());

