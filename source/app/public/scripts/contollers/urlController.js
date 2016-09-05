var app = angular.module("tinyurlApp");

app.controller("urlController", ["$scope", "$http", "$routeParams", "socket", function ($scope, $http, $routeParams, socket) {

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
            return 'rgba(' + r + ',' + g + ',' + b + ',' + a/10 + ')';
        }
    }

    $scope.getClicksByTime = function (time) {
        $scope.lineLabels = [];
        $scope.lineData = [];
        $scope.time = time;
        $http.get("/api/v1/urls/" + $routeParams.colorfulUrl + "/" + time)
            .then(function (response) {
                response.data.forEach(function (info) {
                    var legend = '';
                    if (time === 'hour') {
                        if (info._id.minute < 10) {
                            info._id.minute = '0' + info._id.minute;
                        }
                        legend = info._id.hour + ":" + info._id.minute;
                    } else if (time === 'day') {
                        legend = info._id.hour + ":00";
                    } else if (time === 'month') {
                        legend = info._id.day + "/" + info._id.month;
                    }

                    $scope.lineLabels.push(legend);
                    $scope.lineData.push(info.count);
                });
            });
    };
    $scope.getClicksByTime('hour');

    var renderTotalClicks = function () {
        $http.get("/api/v1/urls/" + $routeParams.colorfulUrl + "/totalClicks")
            .then(function (response) {
                $scope.totalClicks = response.data;
            });
    };

    var renderChart = function (chart, topic) {
        $http.get("/api/v1/urls/" + $routeParams.colorfulUrl + "/" + topic)
            .then(function (response) {
                updateChart(chart, response.data);
            });
    };

    function updateChart(chart, data) {
        $scope[chart + 'Labels'] = [];
        $scope[chart + 'Data'] = [];

        data.forEach(function (info) {
            $scope[chart + 'Labels'].push(info._id);
            $scope[chart + 'Data'].push(info.count);
        });
    }

    var renderCharts = function () {
        renderTotalClicks();
        renderChart('pie', 'referer');
        renderChart('bar', 'country');
        renderChart('doughnut', 'platform');
        renderChart('base', 'browser');
    };
    renderCharts();

    socket.on('newRequestLogged', function (msg) {
        $scope.getClicksByTime($scope.time);
        renderCharts();
    });
}]);