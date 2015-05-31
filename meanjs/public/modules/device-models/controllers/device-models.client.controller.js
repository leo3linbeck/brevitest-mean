'use strict';

// Device models controller
angular.module('device-models').controller('DeviceModelsController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'DeviceModels', 'Devices',
  function($scope, $http, $stateParams, $location, Authentication, DeviceModels, Devices) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

    $scope.loadDevices = function() {
      if (!$scope.devices) {
        $http.post('/devices/load_by_model',
					{
						deviceModelID: $scope.deviceModel._id
					}
				).
        success(function(data, status, headers, config) {
          $scope.devices = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
      }
    };

    // Create new Device model
    $scope.create = function() {
      // Create new Device model object
      var deviceModel = new DeviceModels({
        name: this.name,
        reference: this.reference,
        description: this.description
      });

      // Redirect after save
      deviceModel.$save(function(response) {
        $location.path('device-models/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.reference = '';
        $scope.description = '';
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Device model
    $scope.remove = function(deviceModel) {
      if (deviceModel) {
        deviceModel.$remove();

        for (var i in $scope.deviceModels) {
          if ($scope.deviceModels[i] === deviceModel) {
            $scope.deviceModels.splice(i, 1);
          }
        }
      } else {
        $scope.deviceModel.$remove(function() {
          $location.path('device-models');
        });
      }
    };

    // Update existing Device model
    $scope.update = function() {
      var deviceModel = $scope.deviceModel;

      deviceModel.$update(function() {
        $location.path('device-models/' + deviceModel._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Device models
    $scope.find = function() {
      $scope.deviceModels = DeviceModels.query();
    };

    // Find existing Device model
    $scope.findOne = function() {
      $scope.deviceModel = DeviceModels.get({
        deviceModelId: $stateParams.deviceModelId
      });
    };
  }
]);
