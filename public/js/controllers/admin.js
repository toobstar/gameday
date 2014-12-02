var app = angular.module('teamController', ['ngRoute']);
app.controller('adminController', ['$scope','$http','Teams', '$location', function($scope, $http, Teams, $location) {

		$scope.clearAll = function() {
            Teams.clearAll()
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = null;
                    $scope.teams = null;
                });
        }
        $scope.init = function() {
            $scope.loading = true;
            console.log('Teams.init');
            Teams.init()
                .success(function(data) {
                    console.log('Teams.init data res',data);
                });
        };
        $scope.updateEvent = function(id) {
            $scope.loading = true;
            console.log('updateEvent '+id);
            Teams.updateEvent(id)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; 
                });
        }
		$scope.updateCompletedEvents = function() {
            $scope.loading = true;
            console.log('updateCompletedEvents');
            Teams.updateCompletedEvents()
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data;
                    $scope.funcCalled = "success";
                });
        }
        $scope.processEvent = function(id) {
            $scope.loading = true;
            console.log('processEvent '+id);
            Teams.processEvent(id)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; 
                });
        }
		$scope.initEvents = function(id) {
			$scope.loading = true;
            console.log('initEvents '+id);
			Teams.initEvents(id)
				.success(function(data) {
					$scope.loading = false;
					$scope.events = data; 
				});
		};
        $scope.initAllEvents = function() {
            $scope.loading = true;
            console.log('initAllEvents ');
            Teams.initAllEvents()
                .success(function(data) {
                    $scope.loading = false;
                });
        };

        $scope.twitterSearch = function() {
            $scope.loading = true;
            console.log('twitterSearch ');
            Teams.twitterSearch()
                .success(function(data) {
                    $scope.loading = false;
                });
        };

        $scope.funcCalled = null;
        var initAction = ($location.search()).target;
        console.log("initAction", initAction);
        if (initAction == 'updateCompletedEvents') {
            console.log("initAction-updateCompletedEvents");
            $scope.updateCompletedEvents();
            $scope.funcCalled = "loading";
        }

	}]);