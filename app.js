var app = angular.module('omben', ['ngRoute']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: './templates/playerNames.html',
      controller: 'HomeController'
    })
    .when('/game', {
      templateUrl: './templates/game.html',
      controller: 'GameController'
    })
    .otherwise({ redirect: '/' });
});

app.controller('HomeController', function($scope, $location) {
  $scope.go = function(path) {
    var game = new Game([$scope.player1, $scope.player2]);
    game.play();
    $location.path(path);
  }
});

app.controller('GameController', function($scope) {

});