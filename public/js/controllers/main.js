angular.module('teamController', [])

	// inject the Team service factory into our controller
	.controller('mainController', ['$scope','$http','Teams', function($scope, $http, Teams) {
		$scope.formData = {};
		$scope.loading = true;

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

//                if( Object.prototype.toString.call( data ) === '[object Array]' ) {
//                    alert( 'Array!' );
//                }
//                else
//                {
//                    alert( 'Array!' );
//                }

				$scope.teams = data;
				$scope.teamsById = {};

                $.each(data,function(i,t){
                    $scope.teamsById[t.team_id] = t;
                });

				$scope.teams = data;
				$scope.loading = false;
			});

        Teams.getEvents()
            .success(function(data) {

//                if( Object.prototype.toString.call( data ) === '[object Array]' ) {
//                    alert( 'Array!' );
//                }
//                else
//                {
//                    alert( 'Array!' );
//                }

                $scope.events = data;
                $scope.loading = false;
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

		$scope.selectTeam = function(id) {
            $scope.currentTeam = id;
        }

		$scope.clearAll = function() {
            Teams.clearAll()
                // if successful creation, call our get function to get all the new teams
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
                // if successful creation, call our get function to get all the new teams
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
	}]);