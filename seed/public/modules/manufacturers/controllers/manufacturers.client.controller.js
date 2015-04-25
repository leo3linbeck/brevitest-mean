'use strict';

// Manufacturers controller
angular.module('manufacturers').controller('ManufacturersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Manufacturers',
	function($scope, $stateParams, $location, Authentication, Manufacturers) {
		$scope.authentication = Authentication;

		// Create new Manufacturer
		$scope.create = function() {
			// Create new Manufacturer object
			var manufacturer = new Manufacturers ({
				name: this.name
			});

			// Redirect after save
			manufacturer.$save(function(response) {
				$location.path('manufacturers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Manufacturer
		$scope.remove = function(manufacturer) {
			if ( manufacturer ) { 
				manufacturer.$remove();

				for (var i in $scope.manufacturers) {
					if ($scope.manufacturers [i] === manufacturer) {
						$scope.manufacturers.splice(i, 1);
					}
				}
			} else {
				$scope.manufacturer.$remove(function() {
					$location.path('manufacturers');
				});
			}
		};

		// Update existing Manufacturer
		$scope.update = function() {
			var manufacturer = $scope.manufacturer;

			manufacturer.$update(function() {
				$location.path('manufacturers/' + manufacturer._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Manufacturers
		$scope.find = function() {
			$scope.manufacturers = Manufacturers.query();
		};

		// Find existing Manufacturer
		$scope.findOne = function() {
			$scope.manufacturer = Manufacturers.get({ 
				manufacturerId: $stateParams.manufacturerId
			});
		};
	}
]);