var app = angular.module('tinyurlApp', ['ngRoute', 'ngResource', 'chart.js']);

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