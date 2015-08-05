'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('ExportTestController', ['$scope', '$http', '$timeout', '$location', 'Authentication', 'Tests', 'Notification', 'CSV',
	function($scope, $http, $timeout, $location, Authentication, Tests, Notification, CSV) {
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

		$scope.clickTest = function(indx) {
			var id = $scope.tests[indx]._id;
			var pos = $scope.selection.indexOf(id);
			if (pos === -1) {
				$scope.selection.push(id);
			}
			else {
				$scope.selection.splice(pos, 1);
			}
		};

		$scope.selectAll = function() {
			$scope.selection = _.pluck($scope.tests, '_id');
		};

		$scope.deselectAll = function() {
			$scope.selection.length = 0;
		};

		var exportMap = {
			'Test ID': '_id',
			'Assay Name': ['_assay', 'name'],
			'Assay ID': ['_assay', '_id'],
			'Cartridge ID': ['_cartridge', '_id'],
			'Device Name': ['_device', 'name'],
			'Device ID': ['_device', '_id'],
			'Particle ID': ['_device', 'particleID'],
			'Reference': 'reference',
			'Subject': 'subject',
			'Description': 'description',
			'Started On': ['_cartridge', 'startedOn'],
			'Finished On': ['_cartridge', 'finishedOn'],
			'Value': ['_cartridge', 'value'],
			'Reading': 'reading',
			'Result': 'result',
			'Red Max': ['analysis', 'redMax'],
			'Green Max': ['analysis', 'greenMax'],
			'Green Min': ['analysis', 'greenMin'],
			'Red Min': ['analysis', 'redMin'],
			'Standard Curve': 'standardCurve'
		};
		var exportKeys = Object.keys(exportMap);

		function mapFunction(e) {
			var obj = {};
			exportKeys.forEach(function(key) {
				var val = exportMap[key];
				var temp;
				if (angular.isArray(val)) {
					temp = e[val[0]][val[1]];
				}
				else {
					temp = e[val];
				}
				if (angular.isObject(temp)) {
					obj[key] = JSON.stringify(temp);
				}
				else {
					obj[key] = temp.toString();
				}
			});
			return obj;
		}

		$scope.getTestData = function() {
			var a = _.filter($scope.tests, function(e) { return ($scope.selection.indexOf(e._id) !== -1 && e.loaded); });
			console.log(a);
			var b = _.map(a, mapFunction);
			console.log(b);
			return b;
		};

		$scope.getTestHeaders = function() {
			return exportKeys;
		};

		$scope.setup = function() {
			$scope.selection = [];
			$http.get('/tests/exportable').
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
