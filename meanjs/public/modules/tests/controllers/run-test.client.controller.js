'use strict';

var _ = window._;
var $ = window.$;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', '$modal', '$window','Authentication', 'Tests', 'Notification', 'Socket',
  function($scope, $http, $location, $modal, $window, Authentication, Tests, Notification, Socket) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    Socket.on('test.update', function(message) {
      var data = message.split('\n');
        if (data[0] === 'Test complete' || data[2] === '-1') {
          $scope.loadDevices();
        }
      });

    $scope.setupRun = function() {
      $scope.loadDevices();
      $scope.reference = '';
      $scope.subject = '';
      $scope.description = '';
      $scope.cartridge = {};
      $scope.assay = {};
    };

    $scope.refreshDevices = function() {
      console.log('Refreshing device list');
      $http.post('/devices/release').
      success(function(data, status, headers, config) {
        $scope.devices = data;
        $scope.activeDevice = -1;
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    $scope.rescanCartridge = function() {
      Notification.info('Rescanning cartridge, please wait...');
      $http.post('/devices/rescan_cartridge', {
        deviceID: $scope.devices[$scope.activeDevice]._id
      }).
      success(function(data, status, headers, config) {
        $scope.cartridge = data.cartridge;
        $scope.assay = data.assay;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.loadDevices = function() {
      $http.get('/devices/available').
        success(function(data, status, headers, config) {
          $scope.devices = data;
          $scope.activeDevice = -1;
      }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
    };

    $scope.claimDevice = function(indx) {
      if (indx !== $scope.activeDevice) {
        Notification.info('Setting up device, please wait...');
        $http.post('/devices/claim', {
          currentDeviceID: $scope.activeDevice === -1 ? '' : $scope.devices[$scope.activeDevice]._id,
          newDeviceID: $scope.devices[indx]._id
        }).
        success(function(data, status, headers, config) {
          $scope.devices[indx].claimed = true;
          $scope.cartridge = data.cartridge;
          $scope.assay = data.assay;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
          $scope.activeDevice = -1;
        });
        $scope.activeDevice = indx;
      }
    };

    $scope.beginTest = function() {
      var device;
      if (!$scope.reference) {
        Notification.error('You must enter a reference number');
      }
      else {
        if ($scope.activeDevice !== -1) {
          Notification.success('Starting test, please wait...');
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
