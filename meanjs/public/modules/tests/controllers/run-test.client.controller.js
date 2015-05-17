'use strict';

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', 'Tests', 'Prescriptions', 'Devices', 'Cartridges', 'Notification',
	function($scope, $http, Tests, Prescriptions, Devices, Cartridges, Notification) {

		$scope.setupRun = function() {
			$scope.prescriptions = Prescriptions.query();
			$scope.devices = Devices.query();
		};

		$scope.activePrescription = -1;
		$scope.clickPrescription = function(indx) {
			$scope.activePrescription = indx;
		};
		$scope.activeAssay = -1;
		$scope.clickAssay = function(indx) {
			$scope.activeAssay = indx;
			$http.post('/cartridges/unused', {
					assayID: $scope.prescriptions[$scope.activePrescription]._assays[$scope.activeAssay]._id
				}).
				success(function(data, status, headers, config) {
					$scope.cartridges = data;
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
			  });
		};
		$scope.deviceInitialized = false;
		$scope.activeDevice = -1;
		$scope.clickDevice = function(indx) {
			$scope.activeDevice = indx;
		};
		$scope.activeCartridge = -1;
		$scope.clickCartridge = function(indx) {
			$scope.activeCartridge = indx;
		};

		$scope.scanCartridge = function() {
			// replace next line with scanning code
			$scope.activeCartridge = $scope.activeCartridge;
		};

		$scope.initializeDevice = function() {
			if ($scope.activeDevice < 0) {
				Notification.error('Please select a device to initialize');
				return;
			}
			if (!$scope.devices[$scope.activeDevice]) {
				Notification.error('Unknown device');
				return;
			}
			$http.post('/devices/initialize', {
					device: $scope.devices[$scope.activeDevice]
				}).
				success(function(data, status, headers, config) {
					$scope.deviceInitialized = true;
					Notification.success(data.result);
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					$scope.deviceInitialized = false;
					Notification.error(err.message);
			  });

			Notification.info('Initialization started');
		};

		$scope.beginTest = function() {
			if ($scope.activePrescription < 0 || $scope.activeAssay < 0) {
				Notification.error('Please select an assay for testing');
				return;
			}
			if ($scope.activeDevice < 0) {
				Notification.error('Please select a device for testing');
				return;
			}
			if ($scope.activeCartridge < 0) {
				Notification.error('Please select a cartridge for testing');
				return;
			}
			if (!$scope.prescriptions[$scope.activePrescription]._assays[$scope.activeAssay]) {
				Notification.error('Unknown assay');
				return;
			}
			if (!$scope.devices[$scope.activeDevice]) {
				Notification.error('Unknown device');
				return;
			}
			if (!$scope.cartridges[$scope.activeCartridge]) {
				Notification.error('Unknown cartridge');
				return;
			}

			$http.post('/tests/begin', {
					assayID: $scope.prescriptions[$scope.activePrescription]._assays[$scope.activeAssay]._id,
					deviceID: $scope.devices[$scope.activeDevice]._id,
					cartridgeID: $scope.cartridges[$scope.activeCartridge]._id,
					prescriptionID: $scope.prescriptions[$scope.activePrescription]._id
				}).
				success(function(data, status, headers, config) {
					Notification.success('Test underway');
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });

			Notification.info('Test started');
		};
	}
]);
