var mongoose = require('mongoose');

module.exports = mongoose.model('Tweet', {
	event_id : {type : String, default: ''},
	searchParam : {type : String, default: ''},
	text : {type : String, default: ''},
	created : {type : String, default: ''},
	twitterId : {type : Number, default: ''}
});




