'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', 'Tests', 'Sparks', 'Notification',
  function($scope, $http, Tests, Sparks, Notification) {

    $scope.currentPage = 0;

		$scope.pageChanged = function(flag) {

			console.log($scope.currentPage);
			$scope.load();
		};

    $scope.setupReview = function() {

    };

		$scope.load = function() {
	      $http.post('/tests/load', {
					page: $scope.currentPage,
					pageSize: $scope.itemsPerPage
				}).
					success(function(data, status, headers, config) {
	          console.log(data, status);
						$scope.tests = data.tests;
            $scope.totalItems = data.total_count;
				  }).
				  error(function(err, status, headers, config) {
						console.log(err);
						Notification.error(err.message);
				  });
		};

    $scope.updateTest = function(index) {
      var test = $scope.tests[index];
      console.log(test);
      $http.post('/tests/update_one_test', {
        testID: test._id,
        cartridgeID: test._cartridge._id,
        deviceID: test._device._id,
        analysis: test._assay.analysis,
        percentComplete: test.percentComplete
      }).
      success(function(data, status, headers, config) {
        console.log(data, status);
        test.result = data.result;
        test.startedOn = Date(data.startedOn);
        test.finishedOn = Date(data.finishedOn);
        test.percentComplete = data.percentComplete;

        test._cartridge.rawData = data.rawData;
        test._cartridge.result = data.value;
        test._cartridge.startedOn = Date(data.startedOn);
        test._cartridge.finishedOn = Date(data.finishedOn);
        test._cartridge.failed = data.failed;
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
      Notification.success('Test record updating');
    };

    $scope.loadGraph = function(testID) {
      var t = _.findWhere($scope.tests, {
        _id: testID
      });
      $scope.data = t._assay.standardCurve;
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

    $scope.options = {
      axes: {
        x: {
          key: 'x',
          labelFunction: function(value) {
            return value;
          },
          type: 'linear',
          ticks: 5
        },
        y: {
          type: 'linear',
          ticks: 5
        }
      },
      series: [{
        y: 'y',
        color: 'steelblue',
        thickness: '4px',
        type: 'line',
        label: 'Standard Curve'
      }, ],
      lineMode: 'linear',
      tension: 0.7,
      tooltip: {
        mode: 'scrubber',
        formatter: function(x, y, series) {
          return ('(' + x + ',' + y + ')');
        }
      },
      drawLegend: true,
      drawDots: true,
      columnsHGap: 5
    };

    $scope.selectedTest = -1;
    $scope.clickTest = function(indx) {
      $scope.selectedTest = indx;
    };
  }
]);
