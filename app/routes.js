var Event = require('./models/event');
var Team = require('./models/team');

var https = require('https');
var fs = require('fs');
var moment = require('moment-timezone');
var sprintf = require('sprintf').sprintf;
var zlib = require('zlib');
var _ = require("underscore");
var Twit = require('twit');


var T = new Twit({
    consumer_key:         'zXituFczFnvzLGPmPWy0vYdVu'
    , consumer_secret:      'AgASPXspOSFPs0Js3ASmDEwCezjt4GnyYSojLIdbK6J5O0oQ41'
    , access_token:         '2911388558-faOOMDjqhtFOYiLjyT1GpIfqSPwPrSFIBYMANLm'
    , access_token_secret:  'JmX1ytCsNQb6OXmSa2poPX6GanwwxLIHrPTcHTqTIgnZW'
})


var apiCallInProgress = false;

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
    });
}

function fetchTeamData() {
    var method = 'nba/teams';
    fetchData(method,{},processTeamResults);
}

var processEventResults = function(content) {
    apiCallInProgress = false;
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
                calcScores(event);
            });

        //Event.create(event);
    });
}

var teamIdQueue = [];
function fetchTeamEvents() {
    if (teamIdQueue.length > 0) {
        if (apiCallInProgress == false) {
            apiCallInProgress = true;
            var teamId = teamIdQueue.shift();
            var method = 'nba/results/'+teamId;
            fetchData(method,{},processEventResults);
        }

        console.log('fetchTeamEvents waiting 11s');
        setTimeout(function(){fetchTeamEvents()}, 11000);
    }
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
            calcScores(data);
        });
}

var eventIdQueue = [];
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

    var USER_AGENT = 'MyRobot/1.0 (toby.vidler@gmail.com)';
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
                return;
                //process.exit(1);
            }
            encoding = res.headers['content-encoding'];
            if (encoding === 'gzip') {
                buffer = Buffer.concat(chunks);
                zlib.gunzip(buffer, function (err, decoded) {
                    if (err) {
                        console.warn("Error trying to decompress data: " + err.message);
                        //process.exit(1);
                        return;
                    }
                    resultProcessor(decoded, inputId);
                });
            } else {
                resultProcessor(chunks.join(''), inputId);
            }
        });
    }).on('error', function (err) {
            console.warn("Error trying to contact server: " + err.message);
            //process.exit(1);
            return;
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

        var now = moment().subtract(10, 'hours');
        var completedEvents = [];

        _.each(events,function(event) {
            var eventDate = moment(event.event_start_date_time);   // need to confirm timezone situation..
            if (eventDate.isBefore(now)) {
                event.fullModel = null;// clear full model to make object more light weight
                completedEvents.push(event);
            }
        });

        res.json(completedEvents);
    });
};

function calcScores(event) {

    if (event.fullModel && event.fullModel.home_period_scores && event.fullModel.away_period_scores) {

        console.log("calcScores fullModel present ", event.event_id);

        var hps = event.fullModel.home_period_scores;
        var aps = event.fullModel.away_period_scores;

        console.log("hps",hps);
        console.log("aps",aps);

        var homeWonQ1 = hps[0] > aps[0];
        var homeWonQ2 = hps[1] > aps[1];
        var homeWonQ3 = hps[2] > aps[2];
        var homeWonQ4 = hps[3] > aps[3];

        var leadChanges = 0;
        if (homeWonQ1 != homeWonQ2) leadChanges++;
        if (homeWonQ2 != homeWonQ3) leadChanges++;
        if (homeWonQ3 != homeWonQ4) leadChanges++;

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

            var homeWonOt1 = hps[4] > aps[4];
            if (homeWonOt1 != homeWonQ4) leadChanges++;

            if (hps.length > 5) { // OT2
                otDif = Math.abs(hps[5]-aps[5]);
                scoreOtDif = Math.max((5-otDif),3);
                scoreDif += scoreOtDif;

                var homeWonOt2 = hps[4] > aps[4];
                if (homeWonOt2 != homeWonOt1) leadChanges++;
            }
        }

        scoreDif = scoreDif + (leadChanges*3);
        console.log("leadChanges " + leadChanges + " adding " + (leadChanges*3) + " scoreDif now: " + scoreDif);

//        console.log("hps",homeWonQ1,homeWonQ2,homeWonQ3,homeWonQ4);
//        console.log("scoreDif",scoreDif);
//        console.log("diffs",q1Dif,q2Dif,q3Dif,q4Dif);

        var totalDifference = (q1Dif+q2Dif+q3Dif+q4Dif);
        var finalDifference = q4Dif;

//        console.log("leadChanges",leadChanges);
//        console.log("totalDifference",totalDifference);
//        console.log("finalDifference",finalDifference);

        event.pointsTotalDiff = totalDifference;
        event.pointsFinalDiff = finalDifference;
        event.leadChanges = leadChanges;
        event.pointsBasedScore = scoreDif;

        if (scoreDif > 15)
            event.pointsBasedRating = 'A';
        else if (scoreDif > 10)
            event.pointsBasedRating = 'B';
        else
            event.pointsBasedRating = 'C';


        event.save();
        //event._id = null; // clear id to prevent:    errmsg: 'exception: Mod on _id not allowed',
//        Event.findOneAndUpdate(
//            {event_id: event.event_id},
//            event.toObject(),
//            {upsert: false}, function(err2, data2){
//                if (err2) {
//                    console.log('Event.findOneAndUpdate error:', event.event_id, err2)
//                }
//            });
    }
//    else {
//        console.log("calcScores no fullModel present ", event.event_id);
//    }
}

module.exports = function (app) {

    // api ---------------------------------------------------------------------



    app.get('/api/twitterSearch', function (req, res) {
        T.get('search/tweets', {
            q: 'GSW ORL since:2014-11-26 until:2014-11-28', count: 100 }, function(err, data, response) {
                console.log(data)
        })
        res.send('done')
    });

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

    app.get('/api/initTeams', function (req, res) {
        fetchTeamData();
        console.log('initTeams app.get2');
        res.send('done')
    });

    app.get('/api/initAllEvents', function (req, res) {
        console.log('initAllEvents');

        Team.find(function (err, teams) {
            console.log('Team.find');
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            _.each(teams,function(team){
                console.log('initEvents for '+team.team_id);
                teamIdQueue.push(team.team_id);
            });

            fetchTeamEvents();
        });

        res.send('done')
    });

    app.get('/api/initEvents/:team_id', function (req, res) {
        console.log('initEvents for '+req.params.team_id);
        teamIdQueue.push(req.params.team_id);
        fetchTeamEvents();
        res.send('done')
    });

    app.get('/api/updateEvent/:event_id', function (req, res) {
        console.log('updateEvent for '+req.params.event_id);
        fetchEventDetail(req.params.event_id);
        getEvents(res);
    });

    app.get('/api/boxScoreForCompleted', function (req, res) {
        console.log('boxScoreForCompleted');

        var now = moment().subtract(10, 'hours');
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
                        calcScores(event);
                    }
                    else {
                        console.log('XXX before now not yet loaded',event.event_start_date_time);
                        eventIdQueue.push(event.event_id);

                    }
                }
                //console.log('boxScoreForCompleted ',event.event_id, event.event_start_date_time);
            });
            queuedFetchEventDetail();

            res.send('done')
//            res.json(events);
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
                calcScores(event);
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