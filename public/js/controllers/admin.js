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
        $scope.initTeams = function() {
            $scope.loading = true;
            console.log('Teams.initTeams');
            Teams.initTeams()
                .success(function(data) {
                    console.log('Teams.initTeams data res',data);
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
		$scope.boxScoreForCompleted = function() {
            $scope.loading = true;
            console.log('boxScoreForCompleted');
            Teams.boxScoreForCompleted()
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

        $scope.twitterForCompleted = function() {
            $scope.loading = true;
            console.log('twitterForCompleted ');
            Teams.twitterForCompleted()
                .success(function(data) {
                    $scope.loading = false;
                });
        };


//        $scope.funcCalled = null;
//        var initAction = ($location.search()).target;
//        console.log("initAction", initAction);
//        if (initAction == 'boxScoreForCompleted') {
//            console.log("initAction-boxScoreForCompleted");
//            $scope.boxScoreForCompleted();
//            $scope.funcCalled = "loading";
//        }

	}]);