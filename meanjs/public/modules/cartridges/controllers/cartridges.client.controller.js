'use strict';

// Cartridges controller
angular.module('cartridges').controller('CartridgesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Cartridges',
	function($scope, $stateParams, $location, Authentication, Cartridges) {
		$scope.authentication = Authentication;

		$scope.showResultsOnOpen = true;

		// Create new Cartridge
		$scope.create = function() {
			// Create new Cartridge object
			var cartridge = new Cartridges ({
				name: this.name
			});

			// Redirect after save
			cartridge.$save(function(response) {
				$location.path('cartridges/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Cartridge
		$scope.remove = function(cartridge) {
			if ( cartridge ) {
				cartridge.$remove();

				for (var i in $scope.cartridges) {
					if ($scope.cartridges [i] === cartridge) {
						$scope.cartridges.splice(i, 1);
					}
				}
			} else {
				$scope.cartridge.$remove(function() {
					$location.path('cartridges');
				});
			}
		};

		// Update existing Cartridge
		$scope.update = function() {
			var cartridge = $scope.cartridge;

			cartridge.$update(function() {
				$location.path('cartridges/' + cartridge._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Cartridges
		$scope.find = function() {
			$scope.cartridges = Cartridges.query();
		};

		// Find existing Cartridge
		$scope.findOne = function() {
			$scope.cartridge = Cartridges.get({
				cartridgeId: $stateParams.cartridgeId
			});
		};
	}
]);
