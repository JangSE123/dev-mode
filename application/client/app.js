'use strict';

var app = angular.module('application', []);

app.controller('AppCtrl', function ($scope, appFactory) {
    $("#success_init").hide();
    $("#success_qurey").hide();
    $("#success_delete").hide();

    $scope.initAB = function () {
        $("#success_init").hide();
        appFactory.initAB($scope.abstore, function (data) {
            if (data == "")
                $scope.init_ab = "success";
            $("#success_init").show();
        });
    }
    $scope.queryAB = function () {
        $("#success_qurey").hide();
        appFactory.queryAB($scope.walletid, function (data) {
            $scope.query_ab = data;
            $("#success_qurey").show();
        });
    }
    $scope.deleteAB = function () {
        $("#success_delete").hide();
        appFactory.deleteAB($scope.deleteid, function (data) {
            $scope.delete_ab = "success";
            $("#success_delete").show();
        })
    }
});
app.factory('appFactory', function ($http) {

    var factory = {};

    factory.initAB = function (data, callback) {
        $http.get('/init?a=' + data.a + '&aval=' + data.aval).success(function (output) {
            callback(output)
        });
    }
    factory.queryAB = function (name, callback) {
        $http.get('/query?name=' + name).success(function (output) {
            callback(output)
        });
    }

    factory.deleteAB = function (name, callback) {
        $http.get('/delete?name=' + name).success(function (output) {
            callback(output)
        });
    }
    return factory;
});
