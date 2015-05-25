'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', 'Tests', 'Notification', 'Socket',
	function($scope, $http, $timeout, Tests, Notification, Socket) {

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
			$http.get('/tests/underway').
				success(function(data, status, headers, config) {
					$scope.tests = data;
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });

			Socket.on('test.update', function(message) {
				var data = message.split('\n');
				var indx = -1;
				$scope.tests.forEach(function(e, i) {
					if (e._cartridge._id === data[1]) {
						e.status = data[0].length ? data[0] : e.status;
						e.percentComplete = parseInt(data[2]);
						if (e.percentComplete === 100) {
							indx = i;
						}
					}
				});
				if (indx !== -1) {
					updateTest($scope.tests[indx]);
					$timeout(function() {
						$scope.tests.splice(indx, 1);
					}, 2000);
				}
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
					updateTest(test);
					Notification.success('Test cancelled');
					$timeout(function() {
						$scope.tests.splice(index, 1);
					}, 2000);
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};
	}
]);
