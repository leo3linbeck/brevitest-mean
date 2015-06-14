'use strict';

var _ = window._;

// Cartridges controller
angular.module('cartridges').controller('CartridgeLabelsController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Notification', 'Cartridges', 'Assays',
	function($scope, $http, $stateParams, $location, $window, Authentication, Notification, Cartridges, Assays) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		$scope.showResultsOnOpen = true;

		$scope.getQRCode = function(indx) {
			var id = $scope.cartridges[indx]._id;
			var qr = qrcode(2, 'Q');  // jshint ignore:line
			qr.addData(id);
			qr.make();
			console.log('qr', qr);
		};

		$scope.selectedCartridges = {};
		$scope.numberOfSelectedCartridges = 0;
		$scope.selectCartridge = function(indx) {
			var id = $scope.cartridges[indx]._id;
			$scope.selectedCartridges[id] = !$scope.selectedCartridges[id];
			$scope.numberOfSelectedCartridges += $scope.selectedCartridges[id] ? 1 : -1;
		};
		$scope.cartridgeSelected = function(indx) {
			return !!$scope.selectedCartridges[$scope.cartridges[indx]._id];
		};
		$scope.selectAll = function() {
			$scope.cartridges.forEach(function(e, i) {
				$scope.numberOfSelectedCartridges += $scope.selectedCartridges[e._id] ? 0 : 1;
				$scope.selectedCartridges[e._id] = true;
			});
		};
		$scope.deselectAll = function() {
			$scope.cartridges.forEach(function(e, i) {
				$scope.numberOfSelectedCartridges += $scope.selectedCartridges[e._id] ? -1 : 0;
				$scope.selectedCartridges[e._id] = false;
			});
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

		$scope.skips = 0;

		$scope.adjustSkips = function() {
			$http.post('/cartridges/load-labels', {
				page: $scope.currentPage,
				pageSize: $scope.itemsPerPage
			}).
				success(function(data, status, headers, config) {
					console.log(data);
					$scope.cartridges = data.cartridges;
					for (var i = 0; i < $scope.skips; i += 1) {
						$scope.cartridges.splice(0, 0, {_id: 'nothing'});
					}
					$scope.totalItems = data.number_of_items + $scope.skips;
					$scope.totalItems = $scope.totalItems > 32 ? 32 : $scope.totalItems;
					$scope.cartridges.length = $scope.totalItems;
				}).
				error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
				});
		};

		$scope.dropLabel = function(indx) {
			$scope.cartridges.splice(indx, 1);
		};

		$scope.currentPage = 0;
		$scope.itemsPerPage = 32;

		$scope.pageChanged = function() {
			console.log($scope.currentPage);
			$scope.load();
		};

		$scope.load = function() {
	      $http.post('/cartridges/load-labels', {
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
	}
]);
