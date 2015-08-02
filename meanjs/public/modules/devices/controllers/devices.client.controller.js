'use strict';

// Devices controller
angular.module('devices').controller('DevicesController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Devices', 'DeviceModels', 'DevicePools', 'Notification',
  function($scope, $http, $stateParams, $location, $window, Authentication, Devices, DeviceModels, DevicePools, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.unassigned = false;
    $scope.loadUnassigned = function() {
      $scope.unassigned = true;
      $http.get('/devices/unassigned').
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.writeSerialNumber = function() {
      $http.post('/devices/write_serial_number', {
        deviceID: $scope.device._id,
        serialNumber: $scope.device.serialNumber
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success('Serial number updated on device');
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.attachParticle = function() {
      $http.post('/devices/attach_particle', {
        deviceID: $scope.device._id
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success('Particle attached');
        $scope.device = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.detachParticle = function() {
      $http.post('/devices/detach_particle', {
        deviceID: $scope.device._id
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success('Particle detached');
        $scope.device = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.loadData = function() {
      $scope.deviceModels = DeviceModels.query();
      $scope.devicePools = DevicePools.query();
    };

    $scope.refresh = function() {
      $scope.unassigned = false;
      $http.post('/devices/pool').
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
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

    $scope.flashFirmware = function() {
      $http.post('/devices/flash_firmware', {
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
    $scope.devicePool = {};

    $scope.openedMfg = false;
    $scope.openedReg = false;
    $scope.minRegDate = $scope.manufacturedOn;

    $scope.setRegMinDate = function() {
      $scope.minRegDate = $scope.manufacturedOn;
    };

    $scope.selectDeviceModel = function(id) {
      $scope.deviceModel._id = id;
    };

    $scope.selectDevicePool = function(id) {
      $scope.devicePool._id = id;
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
        _devicePool: this.devicePool._id,
        particleID: this.particleID
      });

      // Redirect after save
      device.$save(function(response) {
        $location.path('devices');

        // Clear form fields
        $scope.name = '';
        $scope.particleID = '';
        $scope.serialNumber = '';
        $scope.calibrationSteps = '';
        $scope.status = '';
        $scope.manufacturedOn = '';
        $scope.registeredOn = '';
        $scope.deviceModel = {};
        $scope.devicePool = {};
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
      device._devicePool = $scope.devicePool ? $scope.devicePool._id : '';

      device.$update(function() {
        $location.path('devices');
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
        $scope.devicePools = $scope.devicePools || DevicePools.query();
        $scope.setOnlineButtonText();
        $scope.deviceModel = $scope.device._deviceModel ? $scope.device._deviceModel : {};
        $scope.devicePool = $scope.device._devicePool ? $scope.device._devicePool : {};
      });
    };
  }
]);
