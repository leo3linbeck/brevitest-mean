'use strict';

// Assays controller
angular.module('assays').controller('AssaysController', ['$scope', '$stateParams', '$location', 'Authentication', 'Assays',
	function($scope, $stateParams, $location, Authentication, Assays) {
		$scope.authentication = Authentication;

		// Create new Assay
		$scope.create = function() {
			// Create new Assay object
			var assay = new Assays ({
				name: this.name
			});

			// Redirect after save
			assay.$save(function(response) {
				$location.path('assays/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Assay
		$scope.remove = function(assay) {
			if ( assay ) { 
				assay.$remove();

				for (var i in $scope.assays) {
					if ($scope.assays [i] === assay) {
						$scope.assays.splice(i, 1);
					}
				}
			} else {
				$scope.assay.$remove(function() {
					$location.path('assays');
				});
			}
		};

		// Update existing Assay
		$scope.update = function() {
			var assay = $scope.assay;

			assay.$update(function() {
				$location.path('assays/' + assay._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Assays
		$scope.find = function() {
			$scope.assays = Assays.query();
		};

		// Find existing Assay
		$scope.findOne = function() {
			$scope.assay = Assays.get({ 
				assayId: $stateParams.assayId
			});
		};
	}
]);