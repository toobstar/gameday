//angular.module('gameDay', ['mainController', 'teamService']);
angular.module( 'gameDay', ['mainController', 'teamService'] ).config(
    ['$locationProvider','$routeProvider',
        function ($locationProvider, $routeProvider) {
            //commenting out this line (switching to hashbang mode) breaks the app
            //-- unless # is added to the templates
            //$locationProvider.html5Mode(true);
            $routeProvider.when('/', {
                controller:'mainController'
            });
            $routeProvider.when('/event/:eventId', {
                controller:'mainController'
            });
//                .otherwise({redirectTo:'/'});
        }
    ]);
;



//angular.module('skaffoldApp', ['ngRoute',,'ngSanitize'])
//    .config(['$routeProvider', function ($routeProvider) {
//        $.each(routes, function (route, url) {
//            $routeProvider.when(route, {templateUrl: url});
//        });
//
//        if(defaultRoute)
//            $routeProvider.otherwise({redirectTo: defaultRoute});
//        else
//            $routeProvider.otherwise({redirectTo: '/'});
//    }])
