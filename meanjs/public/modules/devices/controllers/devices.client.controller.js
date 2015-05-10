'use strict';

// Devices controller
angular.module('devices').controller('DevicesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Devices', 'DeviceModels', 'Sparks',
	function($scope, $stateParams, $location, Authentication, Devices, DeviceModels, Sparks) {
		$scope.authentication = Authentication;

		$scope.setOnlineButtonText = function() {
			if ($scope.online) {
				$scope.onlineText = 'Online';
			}
			else {
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
			var device = new Devices ({
				name: this.name,
				serialNumber: this.serialNumber,
				online: this.online,
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
				$scope.online = false;
				$scope.calibrationSteps = '';
				$scope.status = '';
				$scope.manufacturedOn = '';
				$scope.registeredOn = '';
				$scope.deviceModel = {};
				$scope.spark = {};
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
			device._deviceModel = $scope.deviceModel ? $scope.deviceModel._id : '';
			device._spark = $scope.spark ? $scope.spark._id : '';
			device.online = $scope.online;

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
			}, function() {
				$scope.deviceModels = $scope.deviceModels || DeviceModels.query();
				$scope.sparks = $scope.sparks || Sparks.query();
				$scope.online = $scope.device.online;
				$scope.setOnlineButtonText();
				$scope.deviceModel = $scope.device._deviceModel ? $scope.device._deviceModel : {};
				$scope.spark = $scope.device._spark ? $scope.device._spark : {};
			});
		};
	}
]);
