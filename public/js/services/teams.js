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
            initEvents : function(id) {
                console.log('teamService init');
                return $http.get('/api/initEvents/'+id);
            },
            getEvents : function() {
                return $http.get('/api/events');
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