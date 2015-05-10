'use strict';

// Tests controller
angular.module('tests').controller('TestsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Tests', 'Prescriptions', 'Devices', 'Cartridges',
	function($scope, $stateParams, $location, $http, Authentication, Tests, Prescriptions, Devices, Cartridges) {
		$scope.authentication = Authentication;

		$scope.showResultsOnOpen = true;

		$scope.setupRun = function() {
			$scope.prescriptions = Prescriptions.query();
			$scope.devices = Devices.query();
			$scope.cartridges = Cartridges.query();
		};

		$scope.activePrescription = -1;
		$scope.clickPrescription = function(indx) {
			$scope.activePrescription = indx;
		};
		$scope.activeAssay = -1;
		$scope.clickAssay = function(indx) {
			$scope.activeAssay = indx;
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

		$scope.initAlerts = [];
		$scope.closeInitAlert = function(index) {
      $scope.initAlerts.splice(index, 1);
    };
		$scope.initializeDevice = function() {
			if ($scope.activeDevice < 0) {
				$scope.initAlerts.push({type: 'danger', msg: 'Please select a device to initialize'});
				return;
			}
			if (!$scope.devices[$scope.activeDevice]) {
				$scope.initAlerts.push({type: 'danger', msg: 'Unknown device'});
				return;
			}
			$http.post('/devices/initialize', {
					device: $scope.devices[$scope.activeDevice]
				}).
				success(function(data, status, headers, config) {
					$scope.deviceInitialized = true;
					$scope.initAlerts.push({type: 'success', msg: data.result});
			  }).
			  error(function(err, status, headers, config) {
					$scope.deviceInitialized = false;
					$scope.initAlerts.push({type: 'danger', msg: err});
			  });

			$scope.initAlerts.push({type: 'info', msg: 'Initialization started'});
		};

		$scope.runAlerts = [];
		$scope.closeRunAlert = function(index) {
      $scope.runAlerts.splice(index, 1);
    };
		$scope.beginTest = function() {
			if ($scope.activePrescription < 0 || $scope.activeAssay < 0) {
				$scope.runAlerts.push({type: 'danger', msg: 'Please select an assay for testing'});
				return;
			}
			if ($scope.activeDevice < 0) {
				$scope.runAlerts.push({type: 'danger', msg: 'Please select a device for testing'});
				return;
			}
			if ($scope.activeCartridge < 0) {
				$scope.runAlerts.push({type: 'danger', msg: 'Please select a cartridge for testing'});
				return;
			}
			if (!$scope.prescriptions[$scope.activePrescription]._assays[$scope.activeAssay]) {
				$scope.runAlerts.push({type: 'danger', msg: 'Unknown assay'});
				return;
			}
			if (!$scope.devices[$scope.activeDevice]) {
				$scope.runAlerts.push({type: 'danger', msg: 'Unknown device'});
				return;
			}
			if (!$scope.cartridges[$scope.activeCartridge]) {
				$scope.runAlerts.push({type: 'danger', msg: 'Unknown cartridge'});
				return;
			}

			$http.post('/tests/begin', {
					assayId: $scope.prescriptions[$scope.activePrescription]._assays[$scope.activeAssay],
					deviceId: $scope.devices[$scope.activeDevice],
					cartridgeId: $scope.cartridges[$scope.activeCartridge]
				}).
				success(function(data, status, headers, config) {
					$scope.runAlerts.push({type: 'success', msg: data.msg});
			  }).
			  error(function(err, status, headers, config) {
					$scope.runAlerts.push({type: 'danger', msg: err});
			  });

			$scope.initAlerts.push({type: 'info', msg: 'Test started'});
		};

		// Create new Test
		$scope.create = function() {
			// Create new Test object
			var test = new Tests ({
				name: this.name,
				description: this.description
			});

			// Redirect after save
			test.$save(function(response) {
				$location.path('tests/' + response._id);

				// Clear form fields
				$scope.name = '';
				$scope.description = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Test
		$scope.remove = function(test) {
			if ( test ) {
				test.$remove();

				for (var i in $scope.tests) {
					if ($scope.tests [i] === test) {
						$scope.tests.splice(i, 1);
					}
				}
			} else {
				$scope.test.$remove(function() {
					$location.path('tests');
				});
			}
		};

		// Update existing Test
		$scope.update = function() {
			var test = $scope.test;

			test.$update(function() {
				$location.path('tests/' + test._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Tests
		$scope.find = function() {
			$scope.tests = Tests.query();
		};

		// Find existing Test
		$scope.findOne = function() {
			$scope.test = Tests.get({
				testId: $stateParams.testId
			});
		};
	}
]);
