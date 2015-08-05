'use strict';

// Cartridges controller
angular.module('cartridges').controller('CartridgesController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Notification', 'Cartridges', 'Assays',
	function($scope, $http, $stateParams, $location, $window, Authentication, Notification, Cartridges, Assays) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		$scope.showOnOpen = true;

		// Create new Cartridge
		$scope.create = function() {
			// Create new Cartridge object
			var cartridge = new Cartridges ({
				name: this.name
			});

			// Redirect after save
			cartridge.$save(function(response) {
				$location.path('cartridges');

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				//$scope.error = errorResponse.data.message;
				Notification.error(errorResponse.data.message);
			});
		};

		// Remove existing Cartridge
		$scope.remove = function(cartridge) {
			if ($window.confirm('Are you sure you want to delete this record?')) {
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
			}
		};

		// Update existing Cartridge
		$scope.update = function() {
			var cartridge = new Cartridges($scope.cartridge);

			cartridge.$update(function() {
				$location.path('cartridges');
			}, function(errorResponse) {
				//$scope.error = errorResponse.data.message;
                Notification.error(errorResponse.data.message);
			});
		};

		// Find a list of Cartridges
		$scope.find = function() {
			$scope.cartridges = Cartridges.query();
		};

		$scope.currentPage = 0;
		$scope.itemsPerPage = 10;

		$scope.pageChanged = function() {
			console.log($scope.currentPage);
			$scope.load();
		};

		$scope.load = function() {
	      $http.post('/cartridges/load', {
					page: $scope.currentPage,
					pageSize: $scope.itemsPerPage
				}).
					success(function(data, status, headers, config) {
	          console.log(data);
						$scope.cartridges = data.cartridges;
						$scope.totalItems = data.number_of_items;
				  }).
				  error(function(err, status, headers, config) {
						console.log(err);
						Notification.error(err.message);
				  });
		};

		// Find existing Cartridge
		$scope.findOne = function() {
			$scope.cartridge = Cartridges.get({
				cartridgeId: $stateParams.cartridgeId
			});
		};
	}
]);
