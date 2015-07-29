'use strict';

var _ = window._;
var $ = window.$;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', '$modal', '$window','Authentication', 'Tests', 'Devices', 'Cartridges', 'Notification',
  function($scope, $http, $location, $modal, $window, Authentication, Tests, Devices, Cartridges, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.refresh = function() {
      console.log('Refreshing device list');
      $http.get('/devices/refresh_pool').
      success(function(data, status, headers, config) {
        Notification.success('Device list refreshed');
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    $scope.loadDevices = function() {
      $http.get('/devices/available').
        success(function(data, status, headers, config) {
          $scope.devices = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
    };

    $scope.setupRun = function() {
      $scope.activeDevice = -1;
      $scope.loadDevices();
      $scope.reference = '';
      $scope.subject = '';
      $scope.description = '';
      $scope.cartridge = null;
      $scope.assay = null;
    };

    $scope.claimDevice = function(indx) {
      Notification.success('Setting up device, please wait...');
      $http.post('/devices/claim', {
        currentDeviceID: $scope.activeDevice === -1 ? null : $scope.devices[$scope.activeDevice]._id,
        newDeviceID: $scope.devices[indx]._id
      }).
      success(function(data, status, headers, config) {
        $scope.activeDevice = indx;
        $scope.devices[indx].claimed = true;
        $scope.cartridge = data.cartridge;
        $scope.assay = data.assay;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.beginTest = function() {
      var device;
      if (!$scope.reference) {
        Notification.error('You must enter a reference number');
      }
      else {
        if ($scope.activeDevice !== -1) {
          console.log('$scope.assay: ', $scope.assay);
          device = $scope.devices[$scope.activeDevice];
          $http.post('/tests/begin', {
            reference: $scope.reference,
            subject: $scope.subject,
            description: $scope.description,
            deviceID: device._id,
            deviceName: device.name,
            assayID: $scope.assay._id,
            assayName: $scope.assay.name,
            cartridgeID: $scope.cartridge._id
          }).
          success(function(data, status, headers, config) {
            Notification.success('Test underway');
            $scope.setupRun();
          }).
          error(function(err, status, headers, config) {
            console.log(err);
            Notification.error(err.message);
          });
        }
      }
    };
  }
]);
