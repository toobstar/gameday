var app = angular.module( 'teamController', [] );

// masonry/angular solution from:   http://plnkr.co/edit/ZuSrSh?p=preview
app.directive('masonryWallDir', function(){
    return {
        controller: [
            '$scope',
            '$element',
            '$attrs',
            function($scope, $element, $attrs){

                var itemSelector,
                    masonryOptions;

                itemSelector = $attrs.masonryWallDir;

                //this element will contain the masonry
                this.wallContainer = $element;

                //we have some default options
                //then overwrite with passed in options
                //then overwrite with the necessary options
                this.masonryOptions = _.assign(
                    {},
                    $scope.$eval($attrs.masonryWallOptions),
                    {
                        itemSelector: itemSelector,
                    }
                );

                //place holder for masonry to be setup and shared across all ng-repeat directive scopes
                this.masonry = new Masonry(
                    this.wallContainer[0],
                    this.masonryOptions
                );

                this.masonry.bindResize();

                var self = this;
                this.debouncedReload = _.debounce(function(){
                    console.log('debouncedReload');
                    self.masonry.reloadItems();
                    self.masonry.layout();
                }, 100);


                $scope.$on('tilesUpdated', function(event, args) {
                    console.log('tilesUpdated');
                    setTimeout(function(){
                        console.log('tilesUpdated delayed reload');
                        self.debouncedReload();
                    }, 300);


                });
            }
        ]
    };
});

app.directive('masonryItemDir',
    function(){
        return {
            scope: true,
            require: '^masonryWallDir',
            link: function(scope, element, attributes, masonryWallDirCtrl){

                console.log('item is repeated');

                imagesLoaded(element, function(){
                    if(scope.$first){
                        console.log('I get prepended');
                        masonryWallDirCtrl.masonry.prepended(element);
                    }else{
                        console.log('I get appended');
                        masonryWallDirCtrl.masonry.appended(element);
                    }
                });

                scope.$on('$destroy', masonryWallDirCtrl.debouncedReload);
            }
        };
    }
);

app.controller('mainController', ['$scope','$http','Teams','$window', function($scope, $http, Teams, $window) {

		$scope.loading = true;
		$scope.eventCount = 10;
        $scope.currentTeam = null;
        $scope.currentRating = null;
        $scope.currentChatter = 1000;
        $scope.onlyWithOz = false;
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
                $scope.$emit('tilesUpdated');
            });


        // local functions

        $scope.showMore = function() {
            $scope.eventCount = $scope.eventCount + 3;
            $scope.$emit('tilesUpdated');
        }

        $scope.matchTeam = function(event){
            var res1 = $scope.matchTeamById(event);
            var res2 = $scope.matchTeamByRating(event);
            var res3 = $scope.matchTeamByChatter(event);
            var res4 = $scope.matchTeamWithAussies(event);
            return res1 && res2 && res3 && res4;
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

        $scope.matchTeamByChatter = function(event){
            if ($scope.currentChatter == 1000)
                return true;

            if (event.twitterScore && event.twitterScore > $scope.currentChatter)
                return true;

            return false;
        }

        $scope.matchTeamWithAussies = function(event){
            return $scope.onlyWithOz == false || (event.aussies && event.aussies.length > 0);
        }

        $scope.showOzDetail = function(event) {
            event.showOzDetail = true;
            console.log('showOzDetail');
            $scope.$emit('tilesUpdated');
        }
        $scope.toggleShowGamesWithAussies = function() {
            $scope.onlyWithOz = !$scope.onlyWithOz;
            console.log('$scope.onlyWithOz',$scope.onlyWithOz);
        }

        var w = angular.element($window);
        w.bind('resize', function () {
            console.log('resize');
            $scope.$emit('tilesUpdated');
        });

}]);

