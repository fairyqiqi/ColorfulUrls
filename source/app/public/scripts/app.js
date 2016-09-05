var app = angular.module('tinyurlApp', ['ngRoute', 'ngResource', 'chart.js']);

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "/public/views/home.html",
            controller: "homeController"
        })
        .when("/urls/:colorfulUrl", {
            templateUrl: "/public/views/url.html",
            controller: "urlController"
        });
});