'use strict';

// Devices controller
angular.module('devices').controller('DevicesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Devices', 'DeviceModels',
	function($scope, $stateParams, $location, Authentication, Devices, DeviceModels) {
		$scope.authentication = Authentication;

		$scope.toggleOnlineButtonText = function(init) {
			var online = $scope.device ? $scope.device.online : $scope.online;
			if (init) {
				online = !online;
			}
			if (online) {
				$scope.onlineText = 'Online';
			}
			else {
				$scope.onlineText = 'Offline';
			}

			return $scope.onlineText;
		};

		$scope.online = $scope.device ? $scope.device.online : false;
		$scope.onlineText = $scope.toggleOnlineButtonText(true);
		$scope.openedMfg = false;
		$scope.openedReg = false;
		$scope.minRegDate = $scope.manufacturedOn;

		$scope.deviceModels = DeviceModels.query();

		$scope.setRegMinDate = function() {
			$scope.minRegDate = $scope.manufacturedOn;
		};

		$scope.selectDeviceModel = function(id) {
			$scope._deviceModel = id;
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
			var device = new Devices ({
				name: this.name,
				serialNumber: this.serialNumber,
				online: this.online,
				calibrationSteps: this.calibrationSteps,
				status: this.status,
				manufacturedOn: this.manufacturedOn,
				registeredOn: this.registeredOn,
				_deviceModel: this._deviceModel
			});

			// Redirect after save
			device.$save(function(response) {
				$location.path('devices/' + response._id);

				// Clear form fields
				$scope.name = '';
				$scope.serialNumber = '';
				$scope.online = false;
				$scope.calibrationSteps = '';
				$scope.status = '';
				$scope.manufacturedOn = '';
				$scope.registeredOn = '';
				$scope._deviceModel = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Device
		$scope.remove = function(device) {
			if ( device ) {
				device.$remove();

				for (var i in $scope.devices) {
					if ($scope.devices [i] === device) {
						$scope.devices.splice(i, 1);
					}
				}
			} else {
				$scope.device.$remove(function() {
					$location.path('devices');
				});
			}
		};

		// Update existing Device
		$scope.update = function() {
			var device = $scope.device;

			device.$update(function() {
				$location.path('devices/' + device._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
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
			});
		};
	}
]);
