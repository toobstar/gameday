var Event = require('./models/event');
var Team = require('./models/team');

var https = require('https');
var fs = require('fs');
var moment = require('moment-timezone');
var sprintf = require('sprintf').sprintf;
var zlib = require('zlib');
var _ = require("underscore");


var processTeamResults = function(content) {
    console.log('print result ', content);
    var teams = JSON.parse(content);
    teams.forEach(function (team) {
        console.log('creating '+team.full_name);
        Team.findOneAndUpdate(
            {team_id: team.team_id},
            team,
            {upsert: true}, function(err, data){
                console.log('Team.findOneAndUpdate result', err, data)
            });
        //Team.create(team);
    });
}

function fetchTeamData() {
    var method = 'nba/teams';
    fetchData(method,{},processTeamResults);
}

var processEventResults = function(content) {
    console.log('print result ', content);
    var events = JSON.parse(content);
    events.forEach(function (event) {
        console.log('creating or updating: ',event);
        event.home_team_id=event.team.team_id;
        //event.home_team_id=event.home_team.team_id;
        event.away_team_id=event.opponent.team_id;
        //event.away_team_id=event.away_team.team_id;
        Event.findOneAndUpdate(
            {event_id: event.event_id},
            event,
            {upsert: true}, function(err, data){
                console.log('Event.findOneAndUpdate result', err, data)
            });

        //Event.create(event);
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

var processEventDetailResults = function(content, eventId) {
    apiCallInProgress = false;
    console.log('processEventDetailResults ', eventId);
    var eventDetail = JSON.parse(content);
    console.log('creating or updating detail: ', eventId);
    eventDetail.fullModel = JSON.parse(content);
    Event.findOneAndUpdate(
        {event_id: eventId},
        eventDetail,
        {upsert: true}, function(err, data){
            console.log('Event.findOneAndUpdate (update) result', err)
            processEvent(data);
        });
}

var eventIdQueue = [];
var apiCallInProgress = false;
var queuedFetchEventDetail = function() {
    console.log('queuedFetchEventDetail ',eventIdQueue);
    if (eventIdQueue.length > 0) {
        if (apiCallInProgress == false) {
            apiCallInProgress = true;
            var eventId = eventIdQueue.shift();
            console.log('queuedFetchEventDetail scheduled ',eventId);
            fetchEventDetail(eventId);
        }

        console.log('queuedFetchEventDetail waiting 11s');
        setTimeout(function(){queuedFetchEventDetail()}, 11000);
    }
};

function fetchEventDetail(eventId) {
    console.log('fetchEventDetail ', eventId);
    var method = 'nba/boxscore/'+eventId;
    fetchData(method,{},processEventDetailResults, eventId);
}

function fetchData(method,params,resultProcessor, inputId) {

    // configure: rhc env-set NBA_ACCESS_TOKEN=929daf54-c374-4951-a2e3-ccc4e79eb6ce -a gd
    var ACCESS_TOKEN = '929daf54-c374-4951-a2e3-ccc4e79eb6ce';
    // Replace with your access token
    if (process.env.NBA_ACCESS_TOKEN) {
        ACCESS_TOKEN = process.env.NBA_ACCESS_TOKEN;
    }

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
                    resultProcessor(decoded, inputId);
                });
            } else {
                resultProcessor(chunks.join(''), inputId);
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
    console.log('getEvents');
    Event.find(function (err, events) {
        console.log('Event.find');
        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        res.json(events);
    });
};

function getCompletedEvents(res) {
    console.log('getCompletedEvents');
    Event.find(function (err, events) {
        console.log('Event.find');
        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err)

        var now = moment();
        var completedEvents = [];

        _.each(events,function(event) {
            var eventDate = moment(event.event_start_date_time);
            if (eventDate.isBefore(now)) {
                completedEvents.push(event);
            }
        });

        res.json(completedEvents);
    });
};

function processEvent(event) {

    if (event.fullModel && event.fullModel.home_period_scores && event.fullModel.away_period_scores) {

        console.log("processEvent fullModel present ", event.event_id);

        var hps = event.fullModel.home_period_scores;
        var aps = event.fullModel.away_period_scores;

        console.log("hps",hps);
        console.log("aps",aps);

        var homeWonQ1 = hps[0] > aps[0];
        var homeWonQ2 = hps[1] > aps[1];
        var homeWonQ3 = hps[2] > aps[2];
        var homeWonQ4 = hps[3] > aps[3];

        var q1Dif = Math.abs(hps[0]-aps[0]);
        var q2Dif = Math.abs(hps[1]-aps[1]);
        var q3Dif = Math.abs(hps[2]-aps[2]);
        var q4Dif = Math.abs(hps[3]-aps[3]);

        var score1Dif = Math.max((2-q1Dif),0);
        var score2Dif = Math.max((4-q2Dif),0);
        var score3Dif = Math.max((6-q3Dif),0);
        var score4Dif = Math.max((8-q4Dif),0);  // less difference = greater score (with weighting towards final quarter)
        var scoreDif = score1Dif + score2Dif + score3Dif + score4Dif;

        if (hps.length > 4) { // overtime
            var otDif = Math.abs(hps[4]-aps[4]);
            var scoreOtDif = Math.max((5-otDif),3);
            scoreDif += scoreOtDif;

            if (hps.length > 5) { // OT2
                otDif = Math.abs(hps[5]-aps[5]);
                scoreOtDif = Math.max((5-otDif),3);
                scoreDif += scoreOtDif;
            }
        }

//        console.log("hps",homeWonQ1,homeWonQ2,homeWonQ3,homeWonQ4);
//        console.log("scoreDif",scoreDif);
//        console.log("diffs",q1Dif,q2Dif,q3Dif,q4Dif);

        var totalDifference = (q1Dif+q2Dif+q3Dif+q4Dif);
        var finalDifference = q4Dif;

        var leadChanges = 0;
        if (homeWonQ1 != homeWonQ2) leadChanges++;
        if (homeWonQ2 != homeWonQ3) leadChanges++;
        if (homeWonQ3 != homeWonQ4) leadChanges++;

//        console.log("leadChanges",leadChanges);
//        console.log("totalDifference",totalDifference);
//        console.log("finalDifference",finalDifference);

        event.pointsTotalDiff = totalDifference;
        event.pointsFinalDiff = finalDifference;
        event.scorePointsDiff = scoreDif;
        event.leadChanges = leadChanges;

        Event.findOneAndUpdate(
            {event_id: event.event_id},
            event.toObject(),
            {upsert: false}, function(err2, data2){
                if (err2) {
                    console.log('Event.findOneAndUpdate error:', err2)
                }
            });
    }
//    else {
//        console.log("processEvent no fullModel present ", event.event_id);
//    }
}

module.exports = function (app) {

    // api ---------------------------------------------------------------------

    app.get('/api/clearAll', function (req, res) {
        Team.remove({}, function (err) {
            console.log('clearAll teams ');
            if (err)
                res.send(err);
        }); // clear all first

        Event.remove({}, function (err) {
            console.log('clearAll events ');
            if (err)
                res.send(err);
        }); // clear all first
    });

    app.get('/api/init', function (req, res) {
        fetchTeamData();
        console.log('init app.get2');
        res.send('done')
    });

    app.get('/api/initEvents/:team_id', function (req, res) {
        console.log('initEvents for '+req.params.team_id);
        fetchTeamEvents(req.params.team_id);
        res.send('done')
    });

    app.get('/api/updateEvent/:event_id', function (req, res) {
        console.log('updateEvent for '+req.params.event_id);
        fetchEventDetail(req.params.event_id);
        getEvents(res);
    });

    app.get('/api/updateCompletedEvents', function (req, res) {
        console.log('updateCompletedEvents');

        var now = moment();
        Event.find({},function (err, events) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err) {
                console.log("error", err);
                res.send(err)
                return;
            }

            _.each(events,function(event){

                var eventDate = moment(event.event_start_date_time);
                if (eventDate.isAfter(now)) {
                    console.log('after now ',event.event_start_date_time);
                }
                else {

                    if (event.fullModel) {
                        console.log('before now already loaded',event.event_start_date_time);
                    }
                    else {
                        console.log('XXX before now not yet loaded',event.event_start_date_time);
                        eventIdQueue.push(event.event_id);

                    }
                }
                //console.log('updateCompletedEvents ',event.event_id, event.event_start_date_time);
            });
            queuedFetchEventDetail();

            //fetchEventDetail(req.params.event_id);
            res.json(events);
        });
    });

    app.get('/api/processEvent/:event_id', function (req, res) {
        console.log('processEvent for '+req.params.event_id);

        Event.findOne(
            {event_id: req.params.event_id},
            function(err, event){
                console.log('Event.findOne result', err, event)
                if (err) {
                    return "error"
                }
                processEvent(event);
            });


        getEvents(res);
    });

    app.get('/api/teams', function (req, res) {

        // use mongoose to get all todos in the database
        console.log('/api/teams');
        getTeams(res);
    });

    app.get('/api/completedEvents', function (req, res) {

        // use mongoose to get all todos in the database
        console.log('/api/completedEvents');
        getCompletedEvents(res);
    });

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