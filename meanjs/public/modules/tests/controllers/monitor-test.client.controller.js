'use strict';

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', 'Tests', 'Notification',
	function($scope, $http, $timeout, Tests, Notification) {
		function runChronjob() {
			console.log('runChronjob');
			var startTime = new Date();
			var timeoutLimit = 1000000;
			var runInterval = 5000;
			(function doIt() {
				$timeout(function() {
					$scope.chronjob();
					var now = new Date();
					if ((now - startTime) > timeoutLimit) {
						$scope.updateOn = false;
						Notification.info('Update timeout');
					}
				}, runInterval)
				.then(function() {
					if ($scope.updateOn) {
						doIt();
					}
				}, function(err) {
					console.log(err);
				});
			})();
		}

		$scope.updateOn = false;
		$scope.toggleChronjob = function() {
			console.log('runChronjob');
			$scope.updateOn = !$scope.updateOn;
			if ($scope.updateOn) {
				Notification.info('Starting updates');
				runChronjob();
			}
			else {
				Notification.info('Updates stopped');
			}
		};

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
		};

		$scope.selectedTest = -1;
		$scope.clickTest = function(indx) {
			$scope.selectedTest = indx;
		};
	}
]);
