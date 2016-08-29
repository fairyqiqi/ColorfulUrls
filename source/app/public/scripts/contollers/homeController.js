var app = angular.module('tinyurlApp');

app.controller("homeController", ["$scope", "$http", "$location", function ($scope, $http, $location) {
    $scope.submit = function () {
        $http.post("/api/v1/urls", {
                longUrl: $scope.longUrl
            })
            .then(function (response) {
                //Because it's angular, the address always starts with /#/,
                //so now the address becomes, say, "http://xxxx:xxx/#/urls/2"
                $location.path("/urls/" + response.data.colorfulUrl); //
            });
    }
}]);