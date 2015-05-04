'use strict';

// Healthcare providers controller
angular.module('healthcare-providers').controller('HealthcareProvidersController', ['$scope', '$stateParams', '$location', 'Authentication', 'HealthcareProviders',
	function($scope, $stateParams, $location, Authentication, HealthcareProviders) {
		$scope.authentication = Authentication;

		// Create new Healthcare provider
		$scope.create = function() {
			// Create new Healthcare provider object
			var healthcareProvider = new HealthcareProviders ({
				name: this.name
			});

			// Redirect after save
			healthcareProvider.$save(function(response) {
				$location.path('healthcare-providers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Healthcare provider
		$scope.remove = function(healthcareProvider) {
			if ( healthcareProvider ) { 
				healthcareProvider.$remove();

				for (var i in $scope.healthcareProviders) {
					if ($scope.healthcareProviders [i] === healthcareProvider) {
						$scope.healthcareProviders.splice(i, 1);
					}
				}
			} else {
				$scope.healthcareProvider.$remove(function() {
					$location.path('healthcare-providers');
				});
			}
		};

		// Update existing Healthcare provider
		$scope.update = function() {
			var healthcareProvider = $scope.healthcareProvider;

			healthcareProvider.$update(function() {
				$location.path('healthcare-providers/' + healthcareProvider._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Healthcare providers
		$scope.find = function() {
			$scope.healthcareProviders = HealthcareProviders.query();
		};

		// Find existing Healthcare provider
		$scope.findOne = function() {
			$scope.healthcareProvider = HealthcareProviders.get({ 
				healthcareProviderId: $stateParams.healthcareProviderId
			});
		};
	}
]);