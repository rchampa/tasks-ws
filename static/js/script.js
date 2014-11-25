    function TasksViewModel() {

        var self = this;
        var host = location.protocol + '//' + location.host;
        self.tasksURI = host+'/todo/api/v1.0/tasks';
        //self.tasksURI = 'http://192.168.1.109:5000/todo/api/v1.0/tasks';
        self.username = "";
        self.password = "";
        self.tasks = ko.observableArray();

        self.ajax = function(uri, method, data) {
            var request = {
                url: uri,
                type: method,
                contentType: "application/json",
                accepts: "application/json",
                cache: false,
                dataType: 'json',
                data: JSON.stringify(data),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", 
                        "Basic " + btoa(self.username + ":" + self.password));
                },
                error: function(jqXHR) {
                    console.log("ajax error " + jqXHR.status);
                }
            };
            return $.ajax(request);
        }
        self.updateTask = function(task, newTask) {
            var i = self.tasks.indexOf(task);
            self.tasks()[i].uri(newTask.uri);
            self.tasks()[i].title(newTask.title);
            self.tasks()[i].description(newTask.description);
            self.tasks()[i].done(newTask.done);
        }

        self.beginAdd = function() {
            $('#add').modal('show');
        }
        self.add = function(task) {
            self.ajax(self.tasksURI, 'POST', task).done(function(data) {
                self.tasks.push({
                    uri: ko.observable(data.task.uri),
                    title: ko.observable(data.task.title),
                    description: ko.observable(data.task.description),
                    done: ko.observable(data.task.done)
                });
            });
        }
        self.beginEdit = function(task) {
            editTaskViewModel.setTask(task);
            $('#edit').modal('show');
        }
        self.edit = function(task, data) {
            self.ajax(task.uri(), 'PUT', data).done(function(res) {
                self.updateTask(task, res.task);
            });
        }
        self.remove = function(task) {
            self.ajax(task.uri(), 'DELETE').done(function() {
                self.tasks.remove(task);
            });
        }
        self.markInProgress = function(task) {
            self.ajax(task.uri(), 'PUT', { done: false }).done(function(res) {
                self.updateTask(task, res.task);
            });
        }
        self.markDone = function(task) {
            self.ajax(task.uri(), 'PUT', { done: true }).done(function(res) {
                self.updateTask(task, res.task);
            });
        }
        self.beginLogin = function() {
            $('#login').modal('show');
        }
        self.login = function(username, password) {
            self.username = username;
            self.password = password;
            self.ajax(self.tasksURI, 'GET').done(function(data) {
                for (var i = 0; i < data.tasks.length; i++) {
                    self.tasks.push({
                        uri: ko.observable(data.tasks[i].uri),
                        title: ko.observable(data.tasks[i].title),
                        description: ko.observable(data.tasks[i].description),
                        done: ko.observable(data.tasks[i].done)
                    });
                }
            }).fail(function(jqXHR) {
                if (jqXHR.status == 403)
                    setTimeout(self.beginLogin, 500);
            });
        }
        
        self.beginLogin();
    }//fin TasksViewModel

    function AddTaskViewModel() {
        var self = this;
        self.title = ko.observable();
        self.description = ko.observable();

        self.addTask = function() {
            $('#add').modal('hide');
            tasksViewModel.add({
                title: self.title(),
                description: self.description()
            });
            self.title("");
            self.description("");
        }
    }

    function EditTaskViewModel() {
        var self = this;
        self.title = ko.observable();
        self.description = ko.observable();
        self.done = ko.observable();

        self.setTask = function(task) {
            self.task = task;
            self.title(task.title());
            self.description(task.description());
            self.done(task.done());
            $('edit').modal('show');
        }

        self.editTask = function() {
            $('#edit').modal('hide');
            tasksViewModel.edit(self.task, {
                title: self.title(),
                description: self.description() ,
                done: self.done()
            });
        }
    }
    function LoginViewModel() {
        var self = this;
        self.username = ko.observable();
        self.password = ko.observable();

        self.login = function() {
            $('#login').modal('hide');
            tasksViewModel.login(self.username(), self.password());
        }
    }
    
    var tasksViewModel = new TasksViewModel();
    var addTaskViewModel = new AddTaskViewModel();
    var editTaskViewModel = new EditTaskViewModel();
    var loginViewModel = new LoginViewModel();
    ko.applyBindings(tasksViewModel, $('#main')[0]);
    ko.applyBindings(addTaskViewModel, $('#add')[0]);
    ko.applyBindings(editTaskViewModel, $('#edit')[0]);
    ko.applyBindings(loginViewModel, $('#login')[0]);