angular.module('teamController', [])

	.controller('mainController', ['$scope','$http','Teams', function($scope, $http, Teams) {

		$scope.loading = true;
		$scope.eventCount = 10;
        $scope.currentTeam = null;
        $scope.currentRating = null;
        $scope.currentRating = '';
        $scope.ratings = ["A","B","C"];

		// REST API ====
		// when landing on the page get all teams
		Teams.get()
			.success(function(data) {
				$scope.teams = data;
				$scope.teamsById = {};

                $.each(data,function(i,t){
                    $scope.teamsById[t.team_id] = t;
                });

				$scope.teams = data;
				$scope.loading = false;
			});

        Teams.completedEvents()
            .success(function(data) {
                $scope.completedEvents = data;
                $scope.loading = false;

                var $container = $('.blogTiles');
                $container.masonry({
                    containerStyle:{
                        position: 'relative',
                        width: '100%'
                    },
                    columnWidth: '.ele',
                    gutter: 0,
                    itemSelector: '.ele',
                    transitionDuration: '.2s',
                    isInitLayout: false
                });
                $container.masonry();
            });


        // local functions

        $scope.showMore = function() {
            $scope.eventCount = $scope.eventCount + 13;
        }

        $scope.matchTeam = function(event){
            var res1 = $scope.matchTeamById(event);
            var res2 = $scope.matchTeamByRating(event);
            return res1 && res2;
        }
        $scope.matchTeamById = function(event){
            if (!$scope.currentTeam || !$scope.currentTeam.team_id)
                return true;

            if (event.away_team_id == $scope.currentTeam.team_id)
                return true;

            if (event.home_team_id == $scope.currentTeam.team_id)
                return true;

            return false;
        }

        $scope.matchTeamByRating = function(event){
            if (!$scope.currentRating)
                return true;

            if (event.pointsBasedRating == $scope.currentRating)
                return true;

            return false;
        }



	}]);