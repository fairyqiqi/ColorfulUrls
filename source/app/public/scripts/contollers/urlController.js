var app = angular.module("tinyurlApp");

app.controller("urlController", ["$scope", "$http", "$routeParams", function ($scope, $http, $routeParams) {
    $http.get("/api/v1/urls/" + $routeParams.colorfulUrl)
        .then(function (response) {
            var data = response.data;
            $scope.colorfulUrl = data.colorfulUrl;
            $scope.longUrl = data.longUrl;
            $scope.colorfulUrlToShow = "http://localhost:7777/" + data.colorfulUrl;
            $scope.mainBackground = convertToRgba(data.colorfulUrl);
            //TODO: set foreground based on background
        });

    function convertToRgba(colorfulUrl) {
        if (colorfulUrl.length != 7) {
            return 'rgba(255,255,255,1)';
        } else {
            var r = parseInt(colorfulUrl.substr(0, 2), 16);
            var g = parseInt(colorfulUrl.substr(2, 2), 16);
            var b = parseInt(colorfulUrl.substr(4, 2), 16);
            var a = colorfulUrl.slice(-1);
            if (a === 'A') {
                a = 10;
            }
            var rgb = 'rgba(' + r + ',' + g + ',' + b + ',' + a/10 + ')';
            return rgb;
        }
    }

    $http.get("/api/v1/urls/" + $routeParams.colorfulUrl + "/totalClicks")
        .then(function (response) {
            $scope.totalClicks = response.data;
        });

    var renderChart = function (chart, topic) {
        $scope[chart + 'Labels'] = [];
        $scope[chart + 'Data'] = [];
        $http.get("/api/v1/urls/" + $routeParams.colorfulUrl + "/" + topic)
            .then(function (response) {
                response.data.forEach(function (info) {
                    $scope[chart + 'Labels'].push(info._id);
                    $scope[chart + 'Data'].push(info.count);
                });
            });
    };
    renderChart('pie', 'referer');
    renderChart('bar', 'country');
}]);