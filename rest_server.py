#!flask/bin/python

"""Alternative version of the ToDo RESTful server implemented using the
Flask-RESTful extension."""

from flask import Flask, jsonify, abort, request, make_response, url_for,render_template
from flask.views import MethodView
from flask.ext.restful import Api, Resource, reqparse, fields, marshal
from flask.ext.httpauth import HTTPBasicAuth

import json,ast
import redis
from constants import REDIS_URL
 
myredis = redis.from_url(REDIS_URL)
app = Flask(__name__, static_url_path = "")
#app = Flask(__name__)
api = Api(app)
auth = HTTPBasicAuth()

#comentar en prod
import logging
from logging import StreamHandler
file_handler = StreamHandler()
app.logger.setLevel(logging.DEBUG)  # set the desired logging level here
app.logger.addHandler(file_handler)
#comentar en prod
 
@auth.get_password
def get_password(username):
    if username == 'todo':
        return 'ws'
    return None
 
@auth.error_handler
def unauthorized():
    return make_response(jsonify( { 'message': 'Unauthorized access' } ), 403)
    # return 403 instead of 401 to prevent browsers from displaying the default auth dialog


#v = {'id': 1,'title': u'Buy groceries','description': u'Milk, Cheese, Pizza, Fruit, Tylenol','done': False}
#app.logger.debug(type(v))

    
"""
tasks = [
    {
        'id': 1,
        'title': u'Buy groceries',
        'description': u'Milk, Cheese, Pizza, Fruit, Tylenol', 
        'done': False
    },
    {
        'id': 2,
        'title': u'Learn Python',
        'description': u'Need to find a good Python tutorial on the web', 
        'done': False
    }
]"""

tasks = []
redis_tasks = myredis.lrange('tasks', 0, -1)

if redis_tasks is not None:
    for single_task in redis_tasks:
        #app.logger.debug(type(single_task))
        json_string = json.dumps(single_task)
        #app.logger.debug(type(json_string))
        json_object = json.loads(json_string)
        #app.logger.debug(json_object)
        #app.logger.debug(type(json_object))
        mydict = ast.literal_eval(json_object)
        tasks.append(mydict)


#myredis.lpush(tasks[1])
 
task_fields = {
    'title': fields.String,
    'description': fields.String,
    'done': fields.Boolean,
    'uri': fields.Url('task')
}

class TaskListAPI(Resource):
    decorators = [auth.login_required]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('title', type = str, required = True, help = 'No task title provided', location = 'json')
        self.reqparse.add_argument('description', type = str, default = "", location = 'json')
        super(TaskListAPI, self).__init__()
        
    def get(self):
        return { 'tasks': map(lambda t: marshal(t, task_fields), tasks) }

    def post(self):
        args = self.reqparse.parse_args()

        if len(tasks)==0:
            index = 1
        else:
            index = tasks[-1]['id'] + 1 # -1 is thr last index

        task = {
            'id': index, 
            'title': args['title'],
            'description': args['description'],
            'done': False
        }
        tasks.append(task)
        return { 'task': marshal(task, task_fields) }, 201

class TaskAPI(Resource):
    decorators = [auth.login_required]
    
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('title', type = str, location = 'json')
        self.reqparse.add_argument('description', type = str, location = 'json')
        self.reqparse.add_argument('done', type = bool, location = 'json')
        super(TaskAPI, self).__init__()

    def get(self, id):
        task = filter(lambda t: t['id'] == id, tasks)
        if len(task) == 0:
            abort(404)
        return { 'task': marshal(task[0], task_fields) }
        
    def put(self, id):
        task = filter(lambda t: t['id'] == id, tasks)
        if len(task) == 0:
            abort(404)
        task = task[0]
        args = self.reqparse.parse_args()
        for k, v in args.iteritems():
            if v != None:
                task[k] = v
        return { 'task': marshal(task, task_fields) }

    def delete(self, id):
        task = filter(lambda t: t['id'] == id, tasks)
        if len(task) == 0:
            abort(404)
        tasks.remove(task[0])
        return { 'result': True }

api.add_resource(TaskListAPI, '/todo/api/v1.0/tasks', endpoint = 'tasks')
api.add_resource(TaskAPI, '/todo/api/v1.0/tasks/<int:id>', endpoint = 'task')



@app.route('/how-to-use-web-services')
def howtouse():
    return render_template('register.html')

