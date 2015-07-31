'use strict';

// Organizations controller
angular.module('organizations').controller('OrganizationsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Organizations',
	function($scope, $stateParams, $location, Authentication, Organizations) {
		$scope.authentication = Authentication;

		// Create new Organization
		$scope.create = function() {
			// Create new Organization object
			var organization = new Organizations ({
				name: this.name
			});

			// Redirect after save
			organization.$save(function(response) {
				$location.path('organizations/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Organization
		$scope.remove = function(organization) {
			if ( organization ) { 
				organization.$remove();

				for (var i in $scope.organizations) {
					if ($scope.organizations [i] === organization) {
						$scope.organizations.splice(i, 1);
					}
				}
			} else {
				$scope.organization.$remove(function() {
					$location.path('organizations');
				});
			}
		};

		// Update existing Organization
		$scope.update = function() {
			var organization = $scope.organization;

			organization.$update(function() {
				$location.path('organizations/' + organization._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Organizations
		$scope.find = function() {
			$scope.organizations = Organizations.query();
		};

		// Find existing Organization
		$scope.findOne = function() {
			$scope.organization = Organizations.get({ 
				organizationId: $stateParams.organizationId
			});
		};
	}
]);