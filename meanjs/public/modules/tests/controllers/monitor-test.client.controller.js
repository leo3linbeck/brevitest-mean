'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', '$location', 'Authentication', 'Tests', 'Notification', 'Socket',
	function($scope, $http, $timeout, $location, Authentication, Tests, Notification, Socket) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		function updateTest(test) {
	      $http.post('/tests/update_one_test', {
	        testID: test._id,
	        cartridgeID: test._cartridge._id,
	        deviceID: test._device._id,
					analysis: test._assay.analysis,
					status: test.status,
	        percentComplete: test.percentComplete
	      }).
	      success(function(data, status, headers, config) {
					Notification.success('Test complete');
	      }).
	      error(function(err, status, headers, config) {
	        Notification.error(err.message);
	      });
	    }

		Socket.on('test.update', function(message) {
			var d = message.split('\n');
			_.find($scope.tests, function(e) {
				if (e._id === d[1]) {
					e.status = d[0].length ? d[0] : e.status;
					if (e.status !== 'Test complete' && e.status !== 'Test cancelled') {
						e.percentComplete = parseInt(d[2]);
					}
					return true;
				}
				return false;
			});
		});

		$scope.setup = function() {
			$http.get('/tests/recently_started').
				success(function(data, status, headers, config) {
					$scope.tests = data;
		  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
		};

		$scope.cancelTest = function(index) {
			var test = $scope.tests[index];

			$http.post('/tests/cancel', {
				testID: test._id,
				cartridgeID: test._cartridge._id,
				deviceID: test._device._id,
				deviceName: test._device.name
			}).
				success(function(data, status, headers, config) {
					test.status = 'Cancelled';
					Notification.success('Test cancelled');
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};
	}
]);
