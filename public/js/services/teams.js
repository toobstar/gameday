angular.module('teamService', [])

	// super simple service
	// each function returns a promise object 
	.factory('Teams', ['$http',function($http) {
		return {
            clearAll : function() {
                console.log('teamService clearAll');
                return $http.get('/api/clearAll');
            },
			init : function() {
				console.log('teamService init');
				return $http.get('/api/init');
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
                console.log('teamService init');
                return $http.get('/api/initEvents/'+id);
            },
            getEvents : function() {
                return $http.get('/api/events');
            },
            updateCompletedEvents : function() {
                return $http.get('/api/updateCompletedEvents');
            },
			get : function() {
				return $http.get('/api/teams');
			},
			create : function(teamData) {
				return $http.post('/api/teams', teamData);
			},
			delete : function(id) {
				return $http.delete('/api/teams/' + id);
			}
		}
	}]);