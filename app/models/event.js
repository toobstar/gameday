var mongoose = require('mongoose');

module.exports = mongoose.model('Event', {
    event_id : {type : String, default: ''},
    event_status : {type : String, default: ''},
    event_start_date_time : {type : String, default: ''},
    event_season_type : {type : String, default: ''}
});


