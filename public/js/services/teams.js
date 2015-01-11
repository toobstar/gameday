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
            upcomingEvents : function() {
                return $http.get('/api/upcomingEvents');
            },
            completedEvents : function() {
                return $http.get('/api/completedEvents');
            },
            initAllEvents : function(securityCode) {
                return $http.get('/api/initAllEvents/'+securityCode);
            },
            getEvents : function() {
                return $http.get('/api/events');
            },
            getOpinions : function() {
                return $http.get('/api/opinions');
            },
            boxScoreForCompleted : function(securityCode) {
                return $http.get('/api/boxScoreForCompleted'+"/"+securityCode);
            },
			get : function() {
				return $http.get('/api/teams');
			},
            flagEvent : function(id,status) {
                return $http.get('/api/flagEvent'+"/"+id+"/"+status);
            },
            twitterSearch : function(securityCode) {
                return $http.get('/api/twitterSearch'+"/"+securityCode);
            },
            twitterForCompleted : function(securityCode) {
                return $http.get('/api/twitterForCompleted'+"/"+securityCode);
            },
            deleteTwitterMsgs : function(securityCode) {
                return $http.get('/api/deleteTwitterMsgs'+"/"+securityCode);
            },
            tweets : function(id) {
                return $http.get('/api/tweets'+"/"+id);
            }
		}
	}]);