'use strict';

// Superusers controller
angular.module('superusers').controller('SuperusersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Superusers',
	function($scope, $stateParams, $location, Authentication, Superusers) {
		$scope.authentication = Authentication;

        $scope.checkModel = {
            user: false,
            admin: false,
            superuser: false
        };

		// Create new Superuser
		$scope.create = function() {
			// Create new Superuser object
			var superuser = new Superusers ({
				name: this.name
			});

			// Redirect after save
			superuser.$save(function(response) {
				$location.path('superusers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Superuser
		$scope.remove = function(superuser) {
			if ( superuser ) { 
				superuser.$remove();

				for (var i in $scope.superusers) {
					if ($scope.superusers [i] === superuser) {
						$scope.superusers.splice(i, 1);
					}
				}
			} else {
				$scope.superuser.$remove(function() {
					$location.path('superusers');
				});
			}
		};

		// Update existing Superuser
		$scope.update = function() {
			var superuser = $scope.superuser;
            console.log('update');
			superuser.$update(function() {
				$location.path('superusers/' + superuser._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Superusers
		$scope.find = function() {
			$scope.superusers = Superusers.query();
		};

		// Find existing Superuser
		$scope.findOne = function() {
			$scope.superuser = Superusers.get({
				userId: $stateParams.userId
			});
		};
	}
]);
