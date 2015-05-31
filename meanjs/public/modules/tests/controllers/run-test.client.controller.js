'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', 'Authentication', 'Tests', 'Prescriptions', 'Devices', 'Cartridges', 'Notification',
	function($scope, $http, $location, Authentication, Tests, Prescriptions, Devices, Cartridges, Notification) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

		function loadAssays(prescription) {
			var tests = _.pluck(prescription._tests, '_assay');
			$scope.pendingAssays = [];
			$scope.completedAssays = [];
			prescription._assays.forEach(function(a) {
					var indx = tests.indexOf(a._id);
					if (indx === -1) {
						$scope.pendingAssays.push(a);
					}
					else {
						$scope.completedAssays.push(a);
					}
			});
		}

		$scope.setupRun = function() {
			$scope.testUnderway = false;
			$scope.activePrescription = -1;
			$scope.activeAssay = -1;
			$scope.deviceInitialized = false;
			$scope.activeDevice = -1;
			$scope.activeCartridge = -1;
			$http.get('/prescriptions/unfilled').
				success(function(data, status, headers, config) {
					$scope.prescriptions = data;
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
			  });
			$http.get('/devices/available').
				success(function(data, status, headers, config) {
					$scope.devices = data;
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
			  });
		};

		var currentPrescription = -1;
		$scope.clickPrescription = function(indx) {
			if(currentPrescription !== indx) {
				$scope.activeAssay = -1;
				$scope.activePrescription = -1;
				loadAssays($scope.prescriptions[indx]);
			}
			currentPrescription = indx;
		};
		$scope.clickAssay = function(indx) {
			$scope.activePrescription = currentPrescription;
			$scope.activeAssay = indx;
			$http.post('/cartridges/unused', {
					assayID: $scope.pendingAssays[$scope.activeAssay]._id
				}).
				success(function(data, status, headers, config) {
					$scope.cartridges = data;
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
			  });
		};
		$scope.clickDevice = function(indx) {
			$scope.activeDevice = indx;
		};
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
			$scope.testUnderway = false;
			$http.post('/devices/initialize', {
					device: $scope.devices[$scope.activeDevice]
				}).
				success(function(data, status, headers, config) {
					$scope.deviceInitialized = true;
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					$scope.deviceInitialized = false;
					Notification.error(err.message);
			  });

			Notification.success('Initialization started');
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
			if (!$scope.pendingAssays[$scope.activeAssay]) {
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
			var assay = $scope.pendingAssays[$scope.activeAssay];
			var cartridge = $scope.cartridges[$scope.activeCartridge];
			var device = $scope.devices[$scope.activeDevice];
			var prescription = $scope.prescriptions[$scope.activePrescription];
			$http.post('/tests/begin', {
					assayID: assay._id,
				  assayName: assay.name,
				  assayBCODE: assay.BCODE,
					analysis: assay.analysis,
					standardCurve: assay.standardCurve,
				  cartridgeID: cartridge._id,
				  deviceID: device._id,
				  deviceName: device.name,
				  prescriptionID: prescription._id
				}).
				success(function(data, status, headers, config) {
					Notification.success('Test underway');
					$scope.testUnderway = true;
					$http.post('/cartridges/unused', {
							assayID: assay._id
						}).
						success(function(data, status, headers, config) {
							$scope.cartridges = data;
					  }).
					  error(function(err, status, headers, config) {
							console.log(err);
							Notification.error(err.message);
					  });
			  }).
			  error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
			  });
		};
	}
]);
