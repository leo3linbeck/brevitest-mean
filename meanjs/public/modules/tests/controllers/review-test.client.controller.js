'use strict';

// Tests controller
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', 'Tests', 'Sparks', 'Notification',
	function($scope, $http, Tests, Sparks, Notification) {

		$scope.setup = function() {
			$http.get('/tests/review').
				success(function(data, status, headers, config) {
					console.log(data);
					$scope.tests = data;
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
		};

		$scope.loadRawData = function(cartridgeID) {
			$http.post('/sparks/record_by_cartridge_id', {
					cartridgeID: cartridgeID
				}).
				success(function(data, status, headers, config) {
					console.log(data);

					$scope.tests.forEach(function(e) {
						if (e._cartridge._id === cartridgeID) {
							e._cartridge.rawData = JSON.parse(data);
						}
					});
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
			Notification.info('Loading data from device');
		};

		$scope.selectedTest = -1;
		$scope.clickTest = function(indx) {
			$scope.selectedTest = indx;
		};
	}
]);
