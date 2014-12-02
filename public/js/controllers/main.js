angular.module('teamController', [])

	// inject the Team service factory into our controller
	.controller('mainController', ['$scope','$http','Teams', function($scope, $http, Teams) {
		$scope.formData = {};
		$scope.loading = true;
		$scope.eventCount = 10;

		$scope.init = function() {
			$scope.loading = true;
			console.log('Teams.init');
			Teams.init()
				// if successful creation, call our get function to get all the new teams
				.success(function(data) {
					console.log('Teams.init data res',data);
				});
		};

		// GET =====================================================================
		// when landing on the page, get all teams and show them
		// use the service to get all the teams
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

//        Teams.getEvents()
//            .success(function(data) {
//                $scope.events = data;
//                $scope.loading = false;
//            });

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



		// CREATE ==================================================================
		// when submitting the add form, send the text to the node API
//		$scope.createTeam = function() {
//
//			// validate the formData to make sure that something is there
//			// if form is empty, nothing will happen
//			if ($scope.formData.text != undefined) {
//				$scope.loading = true;
//
//				// call the create function from our service (returns a promise object)
//				Teams.create($scope.formData)
//
//					// if successful creation, call our get function to get all the new teams
//					.success(function(data) {
//						$scope.loading = false;
//						$scope.formData = {}; // clear the form so our user is ready to enter another
//						$scope.teams = data; // assign our new list of teams
//					});
//			}
//		};

//		$scope.selectTeam = function(id) {
//            $scope.currentTeam = id;
//        }

        $scope.currentTeam = null;
        $scope.currentRating = null;
        $scope.currentRating = '';
        $scope.ratings = ["A","B","C"];

        $scope.showMore = function() {
            $scope.eventCount = $scope.eventCount + 5;
        }

        $scope.matchTeam = function(event){
            //console.log('matchTeam',event);
            var res1 = $scope.matchTeamById(event);
            var res2 = $scope.matchTeamByRating(event);
            return res1 && res2;
        }
        $scope.matchTeamById = function(event){
            //console.log('matchTeamById',event);
            if (!$scope.currentTeam || !$scope.currentTeam.team_id)
                return true;

            if (event.away_team_id == $scope.currentTeam.team_id)
                return true;

            if (event.home_team_id == $scope.currentTeam.team_id)
                return true;

            return false;
        }

        $scope.matchTeamByRating = function(event){
            //console.log('matchTeamByRating',event);
            if (!$scope.currentRating)
                return true;

            if (event.pointsBasedRating == $scope.currentRating)
                return true;

            return false;
        }

		$scope.clearAll = function() {
            Teams.clearAll()
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = null;
                    $scope.teams = null;
                });
        }
        $scope.updateEvent = function(id) {
            $scope.loading = true;
            console.log('updateEvent '+id);
            Teams.updateEvent(id)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; // assign our new list of teams
                });
        }
		$scope.updateCompletedEvents = function(id) {
            $scope.loading = true;
            console.log('updateCompletedEvents '+id);
            Teams.updateCompletedEvents(id)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; // assign our new list of teams
                });
        }
        $scope.processEvent = function(id) {
            $scope.loading = true;
            console.log('processEvent '+id);
            Teams.processEvent(id)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data; // assign our new list of teams
                });
        }
		$scope.initEvents = function(id) {
			$scope.loading = true;
            console.log('initEvents '+id);
			Teams.initEvents(id)
				// if successful creation, call our get function to get all the new teams
				.success(function(data) {
					$scope.loading = false;
					$scope.events = data; // assign our new list of teams
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



	}]);