var mongoose = require('mongoose');

module.exports = mongoose.model('Team', {
	team_id : {type : String, default: '', index: true},
	abbreviation : {type : String, default: ''},
	active : {type : String, default: ''},
	first_name : {type : String, default: ''},
	last_name : {type : String, default: ''},
	conference : {type : String, default: ''},
	division : {type : String, default: ''},
	site_name : {type : String, default: ''},
	city : {type : String, default: ''},
	state : {type : String, default: ''},
	full_name : {type : String, default: ''}
});




