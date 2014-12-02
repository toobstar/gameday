var app = angular.module('teamController', []);
app.controller('adminController', ['$scope','$http','Teams', function($scope, $http, Teams) {

		$scope.updateCompletedEvents = function() {
            $scope.loading = true;
            console.log('updateCompletedEvents');
            Teams.updateCompletedEvents()
                .success(function(data) {
                    $scope.funcCalled = "success";
                });
        }

        $scope.funcCalled = null;
        console.log("initAction-updateCompletedEvents");
        $scope.updateCompletedEvents();
        $scope.funcCalled = "loading";

	}]);