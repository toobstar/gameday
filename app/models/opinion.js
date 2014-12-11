var mongoose = require('mongoose');

module.exports = mongoose.model('Opinion', {
    event_id : {type : String, default: ''},
    ip : {type : String, default: ''},
    state : {type : String, default: ''},
    userVoted : {type : String, default: ''}
});


