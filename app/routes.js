var Event = require('./models/event');
var Team = require('./models/team');

var https = require('https');
var fs = require('fs');
var moment = require('moment-timezone');
var sprintf = require('sprintf').sprintf;
var zlib = require('zlib');


var processTeamResults = function(content) {
    console.log('print result ', content);
    var teams = JSON.parse(content);
    teams.forEach(function (team) {
        console.log('creating '+team.full_name);
        Team.create(team);
    });
}

function fetchTeamData() {
    var method = 'nba/teams';
    var params = {
//    'sport': 'nba',
//    'date': '20141119'
    };
    fetchData(method,params,processTeamResults);
}

var processEventResults = function(content) {
    console.log('print result ', content);
    var events = JSON.parse(content);
    events.forEach(function (event) {
        console.log('creating '+event.event_id);
        Event.create(event);
    });
}

function fetchTeamEvents(teamId) {
    var method = 'nba/results/'+teamId;
    var params = {
//    'sport': 'nba',
//    'date': '20141119'
    };
    fetchData(method,params,processEventResults);
}

function fetchData(method,params,resultProcessor) {

    // Replace with your access token
    var ACCESS_TOKEN = '929daf54-c374-4951-a2e3-ccc4e79eb6ce';
    var USER_AGENT = 'tvBot';
    var TIME_ZONE = 'America/New_York';

    // Set the API method, format, and any parameters
    var host = 'erikberg.com';
    var sport = undefined;

    var id = undefined;
    var format = 'json';


    var url;
    var default_opts;
    var chunks;
    var buffer;
    var encoding;

    url = buildURL(host, sport, method, id, format, params);

    default_opts = {
        'host': host,
        'path': url,
        'headers': {
            'Accept-Encoding': 'gzip',
            'Authorization': 'Bearer ' + ACCESS_TOKEN,
            'User-Agent': USER_AGENT
        }
    };

    https.get(default_opts,function (res) {
        chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });
        res.on('end', function () {
            if (res.statusCode !== 200) {
                // handle error...
                console.warn("Server did not return a 200 response!\n" + chunks.join(''));
                process.exit(1);
            }
            encoding = res.headers['content-encoding'];
            if (encoding === 'gzip') {
                buffer = Buffer.concat(chunks);
                zlib.gunzip(buffer, function (err, decoded) {
                    if (err) {
                        console.warn("Error trying to decompress data: " + err.message);
                        process.exit(1);
                    }
                    resultProcessor(decoded);
                });
            } else {
                resultProcessor(chunks.join(''));
            }
        });
    }).on('error', function (err) {
            console.warn("Error trying to contact server: " + err.message);
            process.exit(1);
        });
}

function buildURL(host, sport, method, id, format, params) {
    var ary = [sport, method, id];
    var path;
    var url;
    var param_list = [];
    var param_string;
    var key;

    path = ary.filter(function (element) {
        return element !== undefined;
    }).join('/');
    url = 'https://' + host + '/' + path + '.' + format;

    // check for parameters and create parameter string
    if (params) {
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                param_list.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
            }
        }
        param_string = param_list.join('&');
        if (param_list.length > 0) {
            url += '?' + param_string;
        }
    }
    return url;
}



function getTeams(res) {
    console.log('getTeams');
    Team.find(function (err, teams) {
        console.log('Team.find');
        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(teams);
    });
};

function getEvents(res) {
    console.log('getTeams');
    Event.find(function (err, events) {
        console.log('Event.find');
        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(events);
    });
};

module.exports = function (app) {

    // api ---------------------------------------------------------------------

    app.get('/api/init', function (req, res) {

        Team.remove({}, function (err, team) {
            console.log('cleaning '+team.team_id);
            if (err)
                res.send(err);
        }); // clear all first

//        Event.remove({}, function (err, event) {
//            console.log('cleaning '+event.event_id);
//            if (err)
//                res.send(err);
//        }); // clear all first

        fetchTeamData();

        console.log('init app.get2');
        res.send('done')
    });

    app.get('/api/initEvents/:team_id', function (req, res) {
        console.log('initEvents for '+req.params.team_id);
        fetchTeamEvents(req.params.team_id);
        res.send('done')
    });

    app.get('/api/teams', function (req, res) {

        // use mongoose to get all todos in the database
        console.log('/api/teams');
        getTeams(res);
    });

    // get all todos
    app.get('/api/events', function (req, res) {

        // use mongoose to get all todos in the database
        console.log('/api/events');
        getEvents(res);
    });

//    // create todo and send back all todos after creation
//    app.post('/api/todos', function (req, res) {
//
//        // create a todo, information comes from AJAX request from Angular
//        Todo.create({
//            text: req.body.text,
//            done: false
//        }, function (err, todo) {
//            if (err)
//                res.send(err);
//
//            // get and return all the todos after you create another
//            getTodos(res);
//        });
//
//    });
//
//    // delete a todo
//    app.delete('/api/todos/:todo_id', function (req, res) {
//        Todo.remove({
//            _id: req.params.todo_id
//        }, function (err, todo) {
//            if (err)
//                res.send(err);
//
//            getTodos(res);
//        });
//    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};