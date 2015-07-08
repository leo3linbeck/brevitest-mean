'use strict';

// Firmware tests controller
angular.module('firmware-tests').controller('FirmwareTestsController', ['$scope', '$stateParams', '$location', 'Authentication', 'FirmwareTests',
	function($scope, $stateParams, $location, Authentication, FirmwareTests) {
		$scope.authentication = Authentication;

		// Create new Firmware test
		$scope.create = function() {
			// Create new Firmware test object
			var firmwareTest = new FirmwareTests ({
				name: this.name
			});

			// Redirect after save
			firmwareTest.$save(function(response) {
				$location.path('firmware-tests/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Firmware test
		$scope.remove = function(firmwareTest) {
			if ( firmwareTest ) { 
				firmwareTest.$remove();

				for (var i in $scope.firmwareTests) {
					if ($scope.firmwareTests [i] === firmwareTest) {
						$scope.firmwareTests.splice(i, 1);
					}
				}
			} else {
				$scope.firmwareTest.$remove(function() {
					$location.path('firmware-tests');
				});
			}
		};

		// Update existing Firmware test
		$scope.update = function() {
			var firmwareTest = $scope.firmwareTest;

			firmwareTest.$update(function() {
				$location.path('firmware-tests/' + firmwareTest._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Firmware tests
		$scope.find = function() {
			$scope.firmwareTests = FirmwareTests.query();
		};

		// Find existing Firmware test
		$scope.findOne = function() {
			$scope.firmwareTest = FirmwareTests.get({ 
				firmwareTestId: $stateParams.firmwareTestId
			});
		};
	}
]);