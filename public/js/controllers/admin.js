var app = angular.module('mainController', ['ngRoute']);
app.controller('adminController', ['$scope','$http','Teams', '$location', function($scope, $http, Teams) {

        $scope.securityCode = "";

		$scope.clearAll = function() {
            Teams.clearAll($scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = null;
                    $scope.teams = null;
                });
        }
        $scope.initTeams = function() {
            $scope.loading = true;
            console.log('Teams.initTeams');
            Teams.initTeams($scope.securityCode)
                .success(function(data) {
                    console.log('Teams.initTeams data res',data);
                });
        };
        $scope.updateEvent = function(id) {
            $scope.loading = true;
            console.log('updateEvent '+id);
            Teams.updateEvent(id, $scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; 
                });
        }
		$scope.boxScoreForCompleted = function() {
            $scope.loading = true;
            console.log('boxScoreForCompleted');
            Teams.boxScoreForCompleted($scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data;
                    $scope.funcCalled = "success";
                });
        }
        $scope.processEvent = function(id) {
            $scope.loading = true;
            console.log('processEvent '+id);
            Teams.processEvent(id, $scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; 
                });
        }
		$scope.initEvents = function(id) {
			$scope.loading = true;
            console.log('initEvents '+id);
			Teams.initEvents(id, $scope.securityCode)
				.success(function(data) {
					$scope.loading = false;
					$scope.events = data; 
				});
		};
        $scope.initAllEvents = function() {
            $scope.loading = true;
            console.log('initAllEvents');
            Teams.initAllEvents($scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                });
        };

        $scope.twitterSearch = function() {
            $scope.loading = true;
            console.log('twitterSearch ');
            Teams.twitterSearch($scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                });
        };

        $scope.twitterForCompleted = function() {
            $scope.loading = true;
            console.log('twitterForCompleted ');
            Teams.twitterForCompleted($scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                });
        };

        $scope.deleteTwitterMsgs = function() {
            $scope.loading = true;
            console.log('deleteTwitterMsgs ');
            Teams.deleteTwitterMsgs($scope.securityCode)
                .success(function(data) {
                    $scope.loading = false;
                });
        };


	}]);