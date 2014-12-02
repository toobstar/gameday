angular.module('teamService', [])

	// super simple service
	// each function returns a promise object 
	.factory('Teams', ['$http',function($http) {
		return {
            clearAll : function() {
                console.log('teamService clearAll');
                return $http.get('/api/clearAll');
            },
			initTeams : function() {
				console.log('teamService initTeams');
				return $http.get('/api/initTeams');
			},
            updateEvent : function(id) {
                console.log('teamService updateEvent');
                return $http.get('/api/updateEvent/'+id);
            },
            processEvent : function(id) {
                console.log('teamService processEvent');
                return $http.get('/api/processEvent/'+id);
            },
            initEvents : function(id) {
                console.log('teamService initEvents');
                return $http.get('/api/initEvents/'+id);
            },
            completedEvents : function() {
                return $http.get('/api/completedEvents');
            },
            initAllEvents : function() {
                return $http.get('/api/initAllEvents');
            },
            getEvents : function() {
                return $http.get('/api/events');
            },
            boxScoreForCompleted : function() {
                return $http.get('/api/boxScoreForCompleted');
            },
			get : function() {
				return $http.get('/api/teams');
			},
			create : function(teamData) {
				return $http.post('/api/teams', teamData);
			},
			delete : function(id) {
				return $http.delete('/api/teams/' + id);
			},
            twitterSearch : function() {
                return $http.get('/api/twitterSearch');
            }


		}
	}]);