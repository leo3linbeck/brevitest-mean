'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', 'Tests', 'Notification', 'Socket',
	function($scope, $http, $timeout, Tests, Notification, Socket) {

		function updateTest(test, index) {
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
				$scope.tests[index].status = data.status;
				$scope.tests[index].percentComplete = data.percentComplete;
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
				var data = message.split('\n');
				$scope.tests.forEach(function(e, i) {
					if (e._cartridge._id === data[1]) {
						e.status = data[0].length ? data[0] : e.status;
						e.percentComplete = parseInt(data[2]);
						if (e.percentComplete === 100) {
							updateTest(e, i);
						}
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
					console.log(data, index);
					updateTest(test, index);
					Notification.success('Test cancelled');
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};
	}
]);
