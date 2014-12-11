var Event = require('./models/event');
var Team = require('./models/team');
var Opinion = require('./models/opinion');

var https = require('https');
var fs = require('fs');
var moment = require('moment-timezone');
var sprintf = require('sprintf').sprintf;
var zlib = require('zlib');
var _ = require("underscore");
var Twit = require('twit');


if (process.env.TWITTER_CONS_KEY) {
    TWITTER_CONS_KEY = process.env.TWITTER_CONS_KEY;
    TWITTER_CONS_SECRET = process.env.TWITTER_CONS_SECRET;
    TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
    TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;
}
else {
    console.warn("missing TWITTER config");
    process.exit(1);
}

if (process.env.SECURITY_CODE) {
    SECURITY_CODE = process.env.SECURITY_CODE;
}
else {
    console.warn("missing SECURITY_CODE config");
    process.exit(1);
}

var T = new Twit({
    consumer_key:         TWITTER_CONS_KEY
    , consumer_secret:      TWITTER_CONS_SECRET
    , access_token:         TWITTER_ACCESS_TOKEN
    , access_token_secret:  TWITTER_ACCESS_SECRET
})

var apiDelayBetweenCalls = 11000; // 6 calls/minute max
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
    var events = JSON.parse(content);
    events.forEach(function (event) {
        console.log('creating or updating: ',event);
        event.home_team_id=event.team.team_id;
        event.away_team_id=event.opponent.team_id;
        Event.findOneAndUpdate(
            {event_id: event.event_id},
            event,
            {upsert: true}, function(err, savedEvent){
                console.log('Event.findOneAndUpdate result', err, savedEvent);
            });
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

        console.log('fetchTeamEvents waiting 11s - queued: ' + teamIdQueue.length);
        setTimeout(function(){fetchTeamEvents()}, apiDelayBetweenCalls);
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

        console.log('queuedFetchEventDetail waiting 11s - queued: ' + eventIdQueue.length);
        setTimeout(function(){queuedFetchEventDetail()}, apiDelayBetweenCalls);
    }
};

var lookup = {};
lookup['atlanta-hawks']='#Hawks,#ATLHawks';
lookup['boston-celtics']='#Celtics';
lookup['brooklyn-nets']='#Bobcats';
lookup['charlotte-hornets']='#Bulls';
lookup['chicago-bulls']='#Cavs, #Cavaliers';
lookup['cleveland-cavaliers']='#Mavs';
lookup['dallas-mavericks']='#Nuggets';
lookup['denver-nuggets']='#Pistons';
lookup['detroit-pistons']='#Warriors,#GSWarriors';
lookup['golden-state-warriors']='#Rockets';
lookup['houston-rockets']='#Pacers';
lookup['indiana-pacers']='#Clippers';
lookup['los-angeles-clippers']='#Lakers';
lookup['los-angeles-lakers']='#Grizzlies';
lookup['memphis-grizzlies']='#MiamiHeat';
lookup['miami-heat']='#Bucks';
lookup['milwaukee-bucks']='#TWolves, #Timberwolves';
lookup['minnesota-timberwolves']='#Nets';
lookup['new-orleans-pelicans']='#Hornets';
lookup['new-york-knicks']='#Knicks';
lookup['oklahoma-city-thunder']='#okcthunder,#OklahomaCityThunder';
lookup['orlando-magic']='#OrlandoMagic, #Magic';
lookup['philadelphia-76ers']='#76ers';
lookup['phoenix-suns']='#Suns';
lookup['portland-trail-blazers']='#TrailBlazers,#Blazers';
lookup['sacramento-kings']='#NBAKings';
lookup['san-antonio-spurs']='#GoSpursGo,#Spurs';
lookup['toronto-raptors']='#Raptors';
lookup['utah-jazz']='#UtahJazz';
lookup['washington-wizards']='#Wizards';




var eventIdTwitterQueue = [];
var queuedFetchEventTwitterDetail = function() {
    console.log('queuedFetchEventTwitterDetail ',eventIdTwitterQueue);
    if (eventIdTwitterQueue.length > 0) {
        if (apiCallInProgress == false) {
            apiCallInProgress = true;
            var eventId = eventIdTwitterQueue.shift();
            console.log('queuedFetchEventTwitterDetail scheduled ',eventId);
            fetchTwitterDetail(eventId);
        }

        console.log('queuedFetchEventTwitterDetail waiting 8s - queued: ' + eventIdTwitterQueue.length);
        setTimeout(function(){queuedFetchEventTwitterDetail()}, 8000);
    }
};

function fetchTwitterDetail(eventId) {

    Event.findOne(
        {event_id: eventId},
        function(err, event){
            console.log('fetchTwitterDetail Event.findOne result', err, eventId)
            if (err) {
                return "error"
            }

            //var searchQuery = '#Warriors #OrlandoMagic  since:2014-11-26 until:2014-11-28';

            var awayTags = lookup[event.away_team_id];
            var homeTags = lookup[event.home_team_id];

            var finishDate = moment(event.event_start_date_time).add(2, 'days');

            var searchParams = {};
            searchParams['count'] = 100;
            searchParams['until'] = finishDate.format('YYYY-MM-DD');

            event.twitterScore = 0;

            _.each(awayTags.split(','),function(awayTag) {
                console.log('awayTag',awayTag);
                searchParams['q'] = encodeURIComponent(awayTag);
                askTwitter(event, searchParams);
            });

            _.each(homeTags.split(','),function(homeTag) {
                console.log('homeTag',homeTag);
                searchParams['q'] = encodeURIComponent(homeTag);
                askTwitter(event, searchParams);
            });

            _.each(awayTags.split(','),function(awayTag) {
                _.each(homeTags.split(','),function(homeTag) {
                    var searchQuery = awayTag + ' ' + homeTag;
                    console.log('tags',searchQuery);
                    searchParams['q'] = encodeURIComponent(searchQuery);
                    askTwitter(event, searchParams);
                });
            });

        });
}

function askTwitter(event, searchParams) {
    console.log('doing twitter search for query: ',searchParams);
    T.get('search/tweets', searchParams, function(err, data, response) {
        apiCallInProgress = false;
        if (err) {
            console.log('error with twitter search', searchParams, err);
        }
        else {

            _.each(data.statuses,function(tweet) {
                console.log("---");
                console.log("---");
                console.log("tweet: ",tweet.created_at);
                console.log("tweet: ",tweet.text );
                console.log("---");
                console.log("---");
            });


//            console.log('0- setting score for '+event.event_id, event.twitterScore, searchParams, data.statuses.length);
//            event.twitterScore = parseInt(event.twitterScore) + parseInt(data.statuses.length);
//            console.log('1- setting score for '+event.event_id, event.twitterScore);
//            event.save();
//            console.log("debug.. ",data);
        }
        //console.log("debug.. ",response);
    })
}

function fetchEventDetail(eventId) {
    console.log('fetchEventDetail ', eventId);
    var method = 'nba/boxscore/'+eventId;
    fetchData(method,{},processEventDetailResults, eventId);
}

function fetchData(method,params,resultProcessor, inputId) {

    if (process.env.NBA_ACCESS_TOKEN) {
        ACCESS_TOKEN = process.env.NBA_ACCESS_TOKEN;
    }
    else {
        console.warn("missing config");
        process.exit(1);
    }

    var USER_AGENT = 'MyRobot/1.0 (www.bestgametowatch.com)';
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



function getOpinions(res) {
    console.log('getOpinions');
    Opinion.find(function (err, opinions) {
        console.log('Opinion.find');

        if (err)
            res.send(err); // if there is an error retrieving, send the error. nothing after res.send(err) will execute

        res.json(opinions);
    });
};

function getTeams(res) {
    console.log('getTeams');
    Team.find(function (err, teams) {
        console.log('Team.find');

        if (err)
            res.send(err); // if there is an error retrieving, send the error. nothing after res.send(err) will execute

        res.json(teams);
    });
};

function getEvents(res) {
    console.log('getEvents');
    Event.find(function (err, events) {
        console.log('Event.find');

        if (err)
            res.send(err);

        res.json(events);
    });
};

function getUpcomingEvents(res) {
    console.log('getUpcomingEvents');
    Event.find(function (err, events) {
        console.log('Event.find');

        if (err)
            res.send(err)

        var upcomingEvents = [];
        _.each(events,function(event) {
            if (!event.pointsBasedRating) {
                upcomingEvents.push(event);
            }
        });
        res.json(upcomingEvents);
    });
}
function getCompletedEvents(res) {
    console.log('getCompletedEvents');
    Event.find(function (err, events) {
        console.log('Event.find');

        if (err)
            res.send(err)

        var completedEvents = [];
        _.each(events,function(event) {
            if (event.pointsBasedRating) {
                event.fullModel = null;// clear full model to make object lighter weight for UI
                completedEvents.push(event);
            }
        });

        res.json(completedEvents);
    });
};

function calcScores(event) {

    if (event.fullModel && event.fullModel.home_period_scores && event.fullModel.away_period_scores) {

        //console.log("calcScores fullModel present ", event.event_id);

        var hps = event.fullModel.home_period_scores;
        var aps = event.fullModel.away_period_scores;

        //console.log("hps",hps);
        //console.log("aps",aps);

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
        //console.log("leadChanges " + leadChanges + " adding " + (leadChanges*3) + " scoreDif now: " + scoreDif);

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
    }

//    if (!event.aussies && event.fullModel && event.fullModel.away_stats && event.fullModel.home_stats) {
    if (event.fullModel && event.fullModel.away_stats && event.fullModel.home_stats) {
        event.aussies = [];
        var ausPlayers = ['EXUM','BAIRSTOW','BOGUT','PATTY','MILLS','INGLES','DELLAVEDOVA','MOTUM','BAYNES'];
        _.each(event.fullModel.away_stats.concat(event.fullModel.home_stats),function(stat){
            //console.log("checking player: ", stat.display_name);
            if (_.contains(ausPlayers, stat.last_name.toUpperCase())) {
                console.log("--found aussie: ", stat.display_name);
                event.aussies.push(
                  {
                      'name':stat.display_name,
                      'minutes':stat.minutes,
                      'points':stat.points,
                      'assists':stat.assists,
                      'turnovers':stat.turnovers,
                      'steals':stat.steals,
                      'blocks':stat.blocks,
                      'field_goal_percentage':stat.field_goal_percentage,
                      'three_point_percentage':stat.three_point_percentage,
                      'free_throw_percentage':stat.free_throw_percentage
                  }
                );
            }
        });
        if (event.aussies.length > 0) {
            event.markModified('aussies');
        }
    }

    if (!event.finalScore && event.fullModel && event.fullModel.home_totals && event.fullModel.home_totals.points) {
        if (Math.random() * 10 > 5) { // randomise order of score display
            console.log("a) setting finalScore for ", event.event_id, event.finalScore);
            event.finalScore = event.fullModel.away_totals.points + '/' + event.fullModel.home_totals.points;
        }
        else {
            console.log("b) setting finalScore for ", event.event_id, event.finalScore);
            event.finalScore = event.fullModel.home_totals.points + '/' + event.fullModel.away_totals.points;
        }
    }

    event.save(function (err, event, numberAffected) {
        if (err) {
            console.log('0-error saving ',err);
        }
    })

}

module.exports = function (app) {

    // api ---------------------------------------------------------------------

    app.get('/api/twitterSearch/:securityCode', function (req, res) {

        if (SECURITY_CODE !== req.params.securityCode) {
            console.log("invalid securityCode ", req.params.securityCode);
            res.send('invalid');
            return;
        }

        var searchQuery = '#Warriors #OrlandoMagic  since:2014-11-26 until:2014-11-28';

        T.get('search/tweets', {
            q: searchQuery, count: 100 }, function(err, data, response) {
                //console.log(data);
                console.log(searchQuery, data.statuses.length);
        })
        res.send('done')
    });


    app.get('/api/twitterForCompleted/:securityCode', function (req, res) {

        if (SECURITY_CODE !== req.params.securityCode) {
            console.log("invalid securityCode ", req.params.securityCode);
            res.send('invalid');
            return;
        }

        console.log('twitterForCompleted');

        var now = moment().subtract(10, 'hours');
        Event.find({},function (err, events) {


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

                    if (event.twitterScore && event.twitterScore > 50) {  // TODO redo while testing
                        console.log('already loaded',event.event_id,event.twitterScore);
                    }
                    else {
                        console.log('not yet loaded',event.event_id);
                        if (eventIdTwitterQueue.length < 10) {  // TODO limit while testing
                            eventIdTwitterQueue.push(event.event_id);
                        }
                    }
                }
            });

            queuedFetchEventTwitterDetail();

            res.send('done')
        });
    });


    app.get('/api/clearAll/:securityCode', function (req, res) {

        if (SECURITY_CODE !== req.params.securityCode) {
            console.log("invalid securityCode ", req.params.securityCode);
            res.send('invalid');
            return;
        }

        Team.remove({}, function (err) {
            console.log('clearAll teams ');
            if (err)
                res.send(err);
        });

        Event.remove({}, function (err) {
            console.log('clearAll events ');
            if (err)
                res.send(err);
        });
    });

    app.get('/api/initTeams/:securityCode', function (req, res) {

        if (SECURITY_CODE !== req.params.securityCode) {
            console.log("invalid securityCode ", req.params.securityCode);
            res.send('invalid');
            return;
        }

        fetchTeamData();
        console.log('initTeams app.get2');
        res.send('done')
    });

    app.get('/api/initAllEvents/:securityCode', function (req, res) {

        if (SECURITY_CODE !== req.params.securityCode) {
            console.log("invalid securityCode ", req.params.securityCode);
            res.send('invalid');
            return;
        }

        console.log('initAllEvents');

        Team.find(function (err, teams) {
            console.log('Team.find');

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

    app.get('/api/boxScoreForCompleted/:securityCode', function (req, res) {

        console.log('boxScoreForCompleted', req.params.securityCode);

        if (SECURITY_CODE !== req.params.securityCode) {
            console.log("invalid securityCode ", req.params.securityCode);
            res.send('invalid');
            return;
        }

        Event.find({},function (err, events) {

            if (err) {
                console.log("error", err);
                res.send(err)
                return;
            }

            _.each(events,function(event){

                //var now = moment().subtract(10, 'hours');
                //var eventDate = moment(event.event_start_date_time);
                var eventStartDateETzone = moment(event.event_start_date_time).zone("-04:00");
                var eventFinishDateETzone = eventStartDateETzone.clone().add(2, 'hours');
                var nowETzone = moment().zone("-04:00");

                if (event.event_id.indexOf('20141210-boston-') > -1) {
                    //console.log('1)checking whether event happened yet.  eventDate: '+eventDate + " moment: " + moment() + " now (sub10): "+ now);
                    //console.log('2)checking whether event happened yet.  eventDate: '+event.event_start_date_time + " now: " + (new Date()));
                    //console.log('3)checking whether event happened yet.  eventDate: '+eventDate.format("dddd, MMMM Do YYYY, h:mm:ss a") + " now: " + nowETzone.format("dddd, MMMM Do YYYY, h:mm:ss a"));
                    console.log('4)checking whether event happened yet.  eventStartDateETzone: '+eventStartDateETzone.format("dddd, MMMM Do YYYY, h:mm:ss a") +
                        " eventFinishDateETzone: " + eventFinishDateETzone.format("dddd, MMMM Do YYYY, h:mm:ss a") +
                        " now: " + nowETzone.format("dddd, MMMM Do YYYY, h:mm:ss a"));

//                    xxxx  20141210-boston-celtics-at-charlotte-hornets
//                    2)checking whether event happened yet.  eventDate: 2014-12-10T19:00:00-05:00 now: Thu Dec 11 2014 10:46:27 GMT+1100 (AEDT)
//                    3)checking whether event happened yet.  eventDate: Thursday, December 11th 2014, 11:00:00 am now: Wednesday, December 10th 2014, 7:46:27 pm
//                    4)checking whether event happened yet.  eventDate: Wednesday, December 10th 2014, 8:00:00 pm now: Wednesday, December 10th 2014, 7:46:27 pm
                }

                if (eventFinishDateETzone.isAfter(nowETzone)) {
                    console.log('after now ',eventFinishDateETzone.format("dddd, MMMM Do YYYY, h:mm:ss a"));
                }
                else {

                    if (event.fullModel) {
                        //console.log('already set box score',event.event_start_date_time);
                        calcScores(event);
                    }
                    else {
                        console.log('XXXX not yet set box score',event.event_start_date_time);
                        eventIdQueue.push(event.event_id);
                    }
                }
                //console.log('boxScoreForCompleted ',event.event_id, event.event_start_date_time);
            });
            queuedFetchEventDetail();

            res.send('done')
        });
    });

//    app.get('/api/processEvent/:event_id/:securityCode', function (req, res) {
//        if (SECURITY_CODE !== req.params.securityCode) {
//            console.log("invalid securityCode ", req.params.securityCode);
//            res.send('invalid');
//            return;
//        }
//
//        console.log('processEvent for '+req.params.event_id, req.params.securityCode);
//
//        Event.findOne(
//            {event_id: req.params.event_id},
//            function(err, event){
//                console.log('Event.findOne result', err, event)
//                if (err) {
//                    return "error"
//                }
//                calcScores(event);
//            });
//
//
//        getEvents(res);
//    });

    app.get('/api/flagEvent/:event_id/:status', function (req, res) {

        console.log('flagEvent for ',req.ip, req.params.event_id, req.params.status);
        Event.findOne(
            {event_id: req.params.event_id},
            function(err, event){
                console.log('Event.findOne result', err, event)
                if (err) {
                    return "error"
                }
                Opinion.findOneAndUpdate(
                    {ip: req.ip, event_id: req.params.event_id},
                    {ip: req.ip, event_id: req.params.event_id, state: req.params.status},
                    {upsert: true}, function(err, data){
                        console.log('Opinion.findOneAndUpdate result', err, data)
                });
            });
    });

    app.get('/api/opinions', function (req, res) {
        console.log('/api/opinions');
        getOpinions(res);
    });

    app.get('/api/teams', function (req, res) {
        console.log('/api/teams');
        getTeams(res);
    });

    app.get('/api/completedEvents', function (req, res) {
        console.log('/api/completedEvents');
        getCompletedEvents(res);
    });

    app.get('/api/upcomingEvents', function (req, res) {
        console.log('/api/upcomingEvents');
        getUpcomingEvents(res);
    });

    app.get('/api/events', function (req, res) {

        console.log('/api/events');
        getEvents(res);
    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html');
    });
};
