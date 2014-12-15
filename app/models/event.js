var mongoose = require('mongoose');

module.exports = mongoose.model('Event', {
    event_id : {type : String, default: '', index: true},

    event_status : {type : String, default: ''},
    event_start_date_time : {type : String, default: ''},
    event_season_type : {type : String, default: ''},
    away_team_id : {type : String, default: ''},
    home_team_id : {type : String, default: ''},

    fullModel : {type : Object, default: null},

    aussies : {type : Object, default: null},
    finalScore : {type : String, default: ''},

    pointsTotalDiff : {type : String, default: ''},
    pointsFinalDiff : {type : String, default: ''},
    pointsBasedScore : {type : String, default: ''},
    pointsBasedRating : {type : String, default: ''},
    leadChanges : {type : String, default: ''},
    twitterScore : {type : Number, default: ''}


});


