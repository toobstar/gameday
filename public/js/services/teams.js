angular.module('teamService', [])

	// super simple service
	// each function returns a promise object 
	.factory('Teams', ['$http',function($http) {
		return {
            clearAll : function(securityCode) {
                console.log('teamService clearAll');
                return $http.get('/api/clearAll'+"/"+securityCode);
            },
			initTeams : function(securityCode) {
				console.log('teamService initTeams');
				return $http.get('/api/initTeams'+"/"+securityCode);
			},
            updateEvent : function(id, securityCode) {
                console.log('teamService updateEvent');
                return $http.get('/api/updateEvent/'+id+"/"+securityCode);
            },
            processEvent : function(id, securityCode) {
                console.log('teamService processEvent');
                return $http.get('/api/processEvent/'+id+"/"+securityCode);
            },
            initEvents : function(id, securityCode) {
                console.log('teamService initEvents');
                return $http.get('/api/initEvents/'+id+"/"+securityCode);
            },
            completedEvents : function() {
                return $http.get('/api/completedEvents');
            },
            initAllEvents : function(securityCode) {
                return $http.get('/api/initAllEvents+"/"+securityCode');
            },
            getEvents : function() {
                return $http.get('/api/events');
            },
            boxScoreForCompleted : function(securityCode) {
                return $http.get('/api/boxScoreForCompleted'+"/"+securityCode);
            },
			get : function() {
				return $http.get('/api/teams');
			},
            twitterSearch : function(securityCode) {
                return $http.get('/api/twitterSearch'+"/"+securityCode);
            },
            twitterForCompleted : function(securityCode) {
                return $http.get('/api/twitterForCompleted'+"/"+securityCode);
            }
		}
	}]);