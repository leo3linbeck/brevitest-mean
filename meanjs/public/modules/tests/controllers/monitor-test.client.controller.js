'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$interval', 'Tests', 'Notification',
	function($scope, $http, $interval, Tests, Notification) {

		$scope.updateOn = false;
		$scope.toggleChronjob = function() {
			console.log('runChronjob');
			$scope.updateOn = !$scope.updateOn;
			if ($scope.updateOn) {
				Notification.info('Updates started');
				var numberOfIntervals = 120;
				var intervalTime = 10000;
				$scope.chronjob();
				return $interval(function() {
						$scope.chronjob();
				}, intervalTime, numberOfIntervals)
				.then(function(intervalPromise) {
					if (!$scope.updateOn) {
						$interval.cancel(intervalPromise);
					}
				});
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
					$scope.updateOn = false;
					if (data.length !== 0) {
						$scope.toggleChronjob();
					}

			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
		};

		$scope.cancelTest = function(index) {
			$http.post('/tests/cancel', {
				testID: $scope.tests[index]._id
			}).
				success(function(data, status, headers, config) {
					console.log(data);
					$scope.tests = data;
					$scope.updateOn = (data.length !== 0);
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};

		$scope.chronjob = function() {
			if ($scope.updateOn) {
				$http.post('/tests/status', {
					tests: $scope.tests
				}).
					success(function(data, status, headers, config) {
						console.log(data);
						$scope.tests.forEach(function(e) {
							data.forEach(function(d) {
								if (d.value && d.value.testID === e._id) {
									e.status = d.value.status || '';
									e.percentComplete = d.value.percentComplete || 0;
								}
							});
						});
						$scope.tests = _.filter($scope.tests, function(e) {return e.status !== 'Complete';});
						if ($scope.tests.length === 0) {
							$scope.toggleChronjob();
						}
				  }).
				  error(function(err, status, headers, config) {
						Notification.error(err.message);
				  });
			}
		};
	}
]);
