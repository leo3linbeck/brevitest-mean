'use strict';

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', 'Tests', 'Notification',
	function($scope, $http, Tests, Notification) {

		$scope.setup = function() {
			$http.get('/tests/underway').
				success(function(data, status, headers, config) {
					console.log(data);
					$scope.tests = data;
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
		};

		$scope.chronjob = function() {
			$http.post('/tests/status', {
				tests: $scope.tests
			}).
				success(function(data, status, headers, config) {
					console.log(data);
					$scope.tests = data;
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });

			Notification.info('Updating test status');
		};

		$scope.selectedTest = -1;
		$scope.clickTest = function(indx) {
			$scope.selectedTest = indx;
		};
	}
]);
