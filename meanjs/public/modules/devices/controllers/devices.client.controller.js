'use strict';

// Devices controller
angular.module('devices').controller('DevicesController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Devices', 'DeviceModels', 'Sparks', 'Notification',
  function($scope, $http, $stateParams, $location, $window, Authentication, Devices, DeviceModels, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.loadData = function() {
      $scope.deviceModels = DeviceModels.query();
      $scope.sparks = Sparks.query();
    };

    $scope.moveToAndSetCalibrationPoint = function() {
      $http.post('/devices/move_to_and_set_calibration_point', {
        device: $scope.device
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success(data.result);
        $scope.device.$save();
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.setOnlineButtonText = function() {
      if ($scope.online) {
        $scope.onlineText = 'Online';
      } else {
        $scope.onlineText = 'Offline';
      }
    };

    $scope.deviceModel = {};
    $scope.spark = {};

    $scope.openedMfg = false;
    $scope.openedReg = false;
    $scope.minRegDate = $scope.manufacturedOn;

    $scope.setRegMinDate = function() {
      $scope.minRegDate = $scope.manufacturedOn;
    };

    $scope.selectDeviceModel = function(id) {
      $scope.deviceModel._id = id;
    };

    $scope.selectSpark = function(id) {
      $scope.spark._id = id;
    };

    $scope.openDatepicker = function($event, dateField) {
      $event.preventDefault();
      $event.stopPropagation();

      switch (dateField) {
        case 'mfg':
          $scope.openedMfg = !$scope.openedMfg;
          break;
        case 'reg':
          $scope.openedReg = !$scope.openedReg;
          break;
      }
    };

    // Create new Device
    $scope.create = function() {
      // Create new Device object
      var device = new Devices({
        name: this.name,
        serialNumber: this.serialNumber,
        calibrationSteps: this.calibrationSteps,
        status: this.status,
        manufacturedOn: this.manufacturedOn,
        registeredOn: this.registeredOn,
        _deviceModel: this.deviceModel._id,
        _spark: this.spark._id
      });

      // Redirect after save
      device.$save(function(response) {
        $location.path('devices/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.serialNumber = '';
        $scope.calibrationSteps = '';
        $scope.status = '';
        $scope.manufacturedOn = '';
        $scope.registeredOn = '';
        $scope.deviceModel = {};
        $scope.spark = {};
      }, function(errorResponse) {
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
      });
    };

    // Remove existing Device
    $scope.remove = function(device) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (device) {
          device.$remove();

          for (var i in $scope.devices) {
            if ($scope.devices[i] === device) {
              $scope.devices.splice(i, 1);
            }
          }
        } else {
          $scope.device.$remove(function() {
            $location.path('devices');
          });
        }
      }
    };

    // Update existing Device
    $scope.update = function() {
      var device = $scope.device;
      device._deviceModel = $scope.deviceModel ? $scope.deviceModel._id : '';
      device._spark = $scope.spark ? $scope.spark._id : '';

      device.$update(function() {
        $location.path('devices/' + device._id);
      }, function(errorResponse) {
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
      });
    };

    // Find a list of Devices
    $scope.find = function() {
      $scope.devices = Devices.query();
    };

    // Find existing Device
    $scope.findOne = function() {
      $scope.device = Devices.get({
        deviceId: $stateParams.deviceId
      }, function() {
        $scope.deviceModels = $scope.deviceModels || DeviceModels.query();
        $scope.sparks = $scope.sparks || Sparks.query();
        $scope.online = $scope.device._spark.connected;
        $scope.setOnlineButtonText();
        $scope.deviceModel = $scope.device._deviceModel ? $scope.device._deviceModel : {};
        $scope.spark = $scope.device._spark ? $scope.device._spark : {};
      });
    };
  }
]);
