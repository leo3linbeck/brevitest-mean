'use strict';

var _ = window._;

// Device pools controller
angular.module('device-pools').controller('DevicePoolsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'DevicePools', 'Users', 'Organizations', 'Notification',
  function($scope, $stateParams, $location, $http, Authentication, DevicePools, Users, Organizations, Notification) {
    $scope.authentication = Authentication;

		$scope.loadData = function() {
			$scope.organizations = Organizations.query();
		};

    $scope.organization = {};
    $scope.selectOrganization = function(id) {
      $scope.organization._id = id;
    };

    $scope.selectDevicePool = function(index) {
      if ($scope.authentication.user._devicePool !== $scope.devicePools[index]._id) {
        $scope.authentication.user._devicePool = $scope.devicePools[index]._id;
        var user = new Users($scope.authentication.user);
        user.$update(function(response) {
          $scope.authentication.user = response;
        }, function(response) {
          $scope.error = response.data.message;
        });
      }
      $http.post('/devices/pool', {
        devicePoolID: $scope.devicePools[index]._id
      }).
      success(function(data, status, headers, config) {
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    // Create new Device pool
    $scope.create = function() {
      // Create new Device pool object
      var devicePool = new DevicePools({
        name: this.name,
        description: this.description,
        _organization: this.organization._id
      });

      // Redirect after save
      devicePool.$save(function(response) {
        $location.path('device-pools');

        // Clear form fields
        $scope.name = '';
        $scope.description = '';
        $scope._organization = {};
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Device pool
    $scope.remove = function(devicePool) {
      if (devicePool) {
        devicePool.$remove();

        for (var i in $scope.devicePools) {
          if ($scope.devicePools[i] === devicePool) {
            $scope.devicePools.splice(i, 1);
          }
        }
      } else {
        $scope.devicePool.$remove(function() {
          $location.path('device-pools');
        });
      }
    };

    // Update existing Device pool
    $scope.update = function() {
      var devicePool = new DevicePools($scope.devicePool);
      devicePool._organization = $scope.organization ? $scope.organization._id : '';

      devicePool.$update(function() {
        $location.path('device-pools');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Device pools
    $scope.find = function() {
      $scope.devicePools = DevicePools.query();
    };

    // Find existing Device pool
    $scope.findOne = function() {
      $scope.devicePool = DevicePools.get({
        devicePoolId: $stateParams.devicePoolId
      }, function() {
        $scope.organizations = $scope.organizations || Organizations.query();
        $scope.organization = $scope.devicePool._organization || {};
        $http.post('/devices/pool', {
          devicePoolID: $stateParams.devicePoolId
        }).
        success(function(data, status, headers, config) {
          $scope.devices = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
      });
    };
  }
]);
