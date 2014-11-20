var mongoose = require('mongoose');

module.exports = mongoose.model('Event', {
    event_id : {type : String, default: ''},
    event_status : {type : String, default: ''},
    start_date_time : {type : String, default: ''},
    season_type : {type : String, default: ''}
});


