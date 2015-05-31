'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', '$location', 'Authentication', 'Tests', 'Notification', 'Socket',
	function($scope, $http, $timeout, $location, Authentication, Tests, Notification, Socket) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

		function updateTest(test) {
			console.log('Updating test', test);
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

		$scope.setup = function() {
			$http.get('/tests/recently_started').
				success(function(data, status, headers, config) {
					$scope.tests = data;
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });


			Socket.on('test.update', function(message) {
				console.log('websocket message', message);
				var data = message.split('\n');
				$scope.tests.forEach(function(e, i) {
					if (e._cartridge._id === data[1]) {
						e.percentComplete = parseInt(data[2]);
						e.status = data[0].length ? data[0] : e.status;
					}
				});
			});
		};

		$scope.cancelTest = function(index) {
			var test = $scope.tests[index];

			$http.post('/tests/cancel', {
				testID: test._id,
				cartridgeID: test._cartridge._id,
				deviceID: test._device._id
			}).
				success(function(data, status, headers, config) {
					console.log(data);
					test.status = 'Cancelled';
					Notification.success('Test cancelled');
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};
	}
]);
