var app = angular.module( 'mainController', ['ngRoute'] );

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
                    }, 100);

                    setTimeout(function(){
                        console.log('tilesUpdated delayed reload');
                        self.debouncedReload();
                    }, 1000);

                    setTimeout(function(){
                        console.log('tilesUpdated delayed reload');
                        self.debouncedReload();
                    }, 5000);

                });
            }
        ]
    };
});

//app.config(
//    function($routeProvider) {
//        $routeProvider.
//            when('/', {templateUrl:'/home'}).
//            when('/users/:user_id',
//            {
//                controller:UserView,
//                templateUrl: function(params){ return '/users/view/' + params.user_id; }
//            }
//        ).
//            otherwise({redirectTo:'/'});
//    }
//);

app.directive('masonryItemDir',
    function(){
        return {
            scope: true,
            require: '^masonryWallDir',
            link: function(scope, element, attributes, masonryWallDirCtrl){
                //console.log('item is repeated');
                imagesLoaded(element, function(){
                    if(scope.$first){
                        //console.log('I get prepended');
                        masonryWallDirCtrl.masonry.prepended(element);
                    }else{
                        //console.log('I get appended');
                        masonryWallDirCtrl.masonry.appended(element);
                    }
                });

                scope.$on('$destroy', masonryWallDirCtrl.debouncedReload);
            }
        };
    }
);

app.controller('mainController', ['$scope','$http','Teams','$window','$location','$routeParams', function($scope, $http, Teams, $window, $location, $routeParams) {
//app.controller('mainController', ['$scope','$http','Teams','$window','$location', function($scope, $http, Teams, $window, $location) {

		$scope.loading = true;
		$scope.eventCount = 6;
		$scope.upcomingCount = 6;
        $scope.currentTeam = null;
        $scope.currentRating = null;
        $scope.currentChatter = 10000;
        $scope.onlyWithOz = false;
        $scope.showUpcoming = false;
        $scope.currentRating = '';
        $scope.ratings = ["A","B","C"];
        $scope.bestGameEver = [];
        $scope.bestGamesByDate = [];
        $scope.completedEvents = [];
        $scope.showingBest = false;
        $scope.events = [];

        $scope.selectedEventId = '';
        var currentGameUrl = $location.search().game;
        console.log("initial currentGameUrl",currentGameUrl);
        if (currentGameUrl) {
            $scope.selectedEventId = currentGameUrl;
        }

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
                $scope.showAll();
                $scope.loading = false;
                $scope.$emit('tilesUpdated');
                $scope.fetchOpinions();

                var bestScoreByDate = {};
                var bestGameByDate = {};
                var bestGameEver = null;
                var bestScoreEver = 0;
                $.each($scope.completedEvents,function(i,e){
                    var eventDate = moment(e.event_start_date_time);
                    var dateStr = eventDate.format('YY-MM-DD');
                    if (!bestScoreByDate[dateStr]) {
                        bestScoreByDate[dateStr] = 0;
                    }

                    var eventIntScore = parseInt(e.pointsBasedScore);
                    if (bestScoreByDate[dateStr] < eventIntScore) {
                        bestScoreByDate[dateStr] = eventIntScore;
                        bestGameByDate[dateStr] = e;
                    }

                    if (eventIntScore > bestScoreEver) {
                        bestScoreEver = eventIntScore;
                        bestGameEver = e;
                    }
                });

                $.each(bestGameByDate,function(date,event){
                    $scope.bestGamesByDate.push(event);
                });

                $scope.bestGameEver.push(bestGameEver);

            });

        Teams.upcomingEvents()
            .success(function(data) {
                $scope.upcomingEvents = data;
                $scope.loading = false;

                $.each($scope.upcomingEvents,function(i,e){
                    var eventDateETzone = moment(e.event_start_date_time).zone("-04:00");
                    var nowETzone = moment().zone("-04:00");

                    var type = 'day';
                    var diff = eventDateETzone.diff(nowETzone, 'days', true);
                    if (Math.abs(diff) < 1) {
                        diff = eventDateETzone.diff(nowETzone, 'hours', true);
                        type = 'hour';
                        if (Math.abs(diff) < 2) {
                            type = 'minute';
                            diff = eventDateETzone.diff(nowETzone, 'minutes');
                        }
                    }

                    if (diff < 0) {
                        var startedYet = 'Started ';
                        var startedYetSuffix = ' ago';
                    }
                    else {
                        var startedYet = 'Starts in ';
                        var startedYetSuffix = '';
                    }

                    diff = Math.abs(diff);
                    diff = Math.floor(diff);
                    e.startingIn = startedYet + diff + ' ' + type + $scope.isPlural(diff) + startedYetSuffix;

                });

            });

        $scope.gotoGame = function(eId) {
            console.log("gotoGame id",eId);
            if (eId) {
                $scope.selectedEventId = eId;
                $scope.$emit('tilesUpdated');
            }
            $location.search('game', eId);
        }

        $scope.isPlural = function(number) {
            if (number > 1) {
                return 's';
            }
            else {
                return '';
            }
        }

        $scope.fetchOpinions = function() {

            Teams.getOpinions()
                .success(function(data) {
                    $scope.opinions = data;
                    //console.log("opinions",$scope.opinions);

                    var opinionsByEventId = {};

                    // group by event
                    $.each($scope.opinions,function(i,o){
                        //console.log("opinion",o);
                        if (!opinionsByEventId[o.event_id]) {
                            opinionsByEventId[o.event_id] = [];
                        }
                        opinionsByEventId[o.event_id].push(o);
                    });

                    $.each($scope.completedEvents,function(i,e){
                        e.likeCount = 0;
                        e.dislikeCount = 0;
                    });

                    // aggregate score & set on local event model
                    $.each(opinionsByEventId,function(eventId,opinionArray){
                        //console.log("opinions for event",opinionArray);
                        var likeCount = 0;
                        var dislikeCount = 0;
                        var userVoted = false;
                        $.each(opinionArray,function(i,o){
                            if (o.state === 'like') {
                                likeCount++;
                            }
                            else if (o.state === 'dislike') {
                                dislikeCount++;
                            }
                            if (o.userVoted == "true") {
                                userVoted = true;
                            }
                        });

                        $.each($scope.completedEvents,function(i,e){
                            if (e.event_id == eventId) {
                                e.likeCount = likeCount;
                                e.dislikeCount = dislikeCount;
                                e.userVoted = userVoted;
                                return;
                            }
                        });
                    });

                    $scope.loading = false;
            });
        }


        // local functions

        $scope.likeEvent = function(event) {
            $scope.flagEvent(event, 'like');
            event.likeCount = event.likeCount+1;
            event.userVoted = true;
        }

        $scope.dislikeEvent = function(event) {
            $scope.flagEvent(event, 'dislike');
            event.dislikeCount = event.dislikeCount+1;
            event.userVoted = true;
        }

        $scope.flagEvent = function(event, status) {
            $scope.loading = true;
            console.log('flagEvent '+event.event_id);
            Teams.flagEvent(event.event_id, status)
                .success(function(data) {
                    $scope.loading = false;
                    $scope.events = data;
                });
        }

        $scope.setCurrentTeam = function(teamId) {
            $scope.currentTeam = $scope.teamsById[teamId];
        }

        $scope.showMore = function() {
            $scope.eventCount = $scope.eventCount + 3;
            $scope.$emit('tilesUpdated');
        }

        $scope.showMoreUpcoming = function() {
            $scope.upcomingCount = $scope.upcomingCount + 3;
        }

        $scope.matchTeam = function(event){
            var res1 = $scope.matchTeamById(event);
            var res2 = $scope.matchTeamByRating(event);
            var res3 = $scope.matchTeamByChatter(event);
            var res4 = $scope.matchTeamWithAussies(event);
            return res1 && res2 && res3 && res4;
        }
        $scope.matchTeamById = function(event){

            if ($scope.selectedEventId && $scope.selectedEventId != '') {
                return event.event_id == $scope.selectedEventId;
            }

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
            if ($scope.currentChatter == 10000)
                return true;

            if (event.twitterScore && parseInt(event.twitterScore) > $scope.currentChatter)
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
            console.log('scope.onlyWithOz',$scope.onlyWithOz);
        }

        $scope.toggleShowUpcoming = function() {
            $scope.showUpcoming = !$scope.showUpcoming;
            console.log('scope.showUpcoming',$scope.showUpcoming);
        }

        $scope.showAll = function(resetSelected) {
            console.log('scope.showAll');
            $scope.events = $scope.completedEvents;
            if (resetSelected) {
                $scope.selectedEventId = '';
                $location.search('game', '');
            }
            $scope.showingBest = false;
        }

        $scope.showBest = function() {
            console.log('scope.showBest');
            $scope.events = $scope.bestGamesByDate;
            $scope.showingBest = true;
        }

        $scope.showBestEver = function() {
            console.log('scope.showBest');
            $scope.events = $scope.bestGameEver;
            $scope.showingBest = true;
        }

        $scope.showWithChatter = function() {
            console.log('scope.showWithChatter');
            $scope.currentChatter = 500;
            $scope.$emit('tilesUpdated');
        }

        $scope.showAllChatter = function() {
            console.log('scope.showWithChatter');
            $scope.currentChatter = 10000;
            $scope.$emit('tilesUpdated');
        }

        $scope.showTweets = function(event) {
            console.log('scope.event',event.event_id);
            Teams.tweets(event.event_id)
                .success(function(data) {
                    $scope.tweets = data;
                });
        }

        $scope.$watch(function() { return $scope.currentRating }, function(value) {
            if(!value) return;
            console.log('currentRating changed');
            $scope.$emit('tilesUpdated');
        });

        $scope.$watch(function() { return $scope.currentTeam }, function(value) {
            if(!value) return;
            console.log('currentTeam changed');
            $scope.$emit('tilesUpdated');
        });

        var w = angular.element($window);
        w.bind('resize', function () {
            console.log('resize');
            $scope.$emit('tilesUpdated');
        });

}]);

