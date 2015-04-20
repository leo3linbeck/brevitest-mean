'use strict';

// Providers controller
angular.module('providers').controller('ProvidersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Providers',
	function($scope, $stateParams, $location, Authentication, Providers) {
		$scope.authentication = Authentication;

		// Create new Provider
		$scope.create = function() {
			// Create new Provider object
			var provider = new Providers ({
				name: this.name
			});

			// Redirect after save
			provider.$save(function(response) {
				$location.path('providers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Provider
		$scope.remove = function(provider) {
			if ( provider ) { 
				provider.$remove();

				for (var i in $scope.providers) {
					if ($scope.providers [i] === provider) {
						$scope.providers.splice(i, 1);
					}
				}
			} else {
				$scope.provider.$remove(function() {
					$location.path('providers');
				});
			}
		};

		// Update existing Provider
		$scope.update = function() {
			var provider = $scope.provider;

			provider.$update(function() {
				$location.path('providers/' + provider._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Providers
		$scope.find = function() {
			$scope.providers = Providers.query();
		};

		// Find existing Provider
		$scope.findOne = function() {
			$scope.provider = Providers.get({ 
				providerId: $stateParams.providerId
			});
		};
	}
]);