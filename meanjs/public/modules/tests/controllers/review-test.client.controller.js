'use strict';

var _ = window._;
var c3 = window.c3;
var d3 = window.d3;

// Tests controller
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', 'Tests', 'Sparks', 'Notification',
  function($scope, $http, Tests, Sparks, Notification) {

    $scope.loadGraph = function(index) {
      var test = $scope.tests[index];
      var a = test._assay.analysis;
      var std = test._assay.standardCurve;
      var cuts = [a.redMin, a.greenMin, a.greenMax, a.redMax];

      var xs = _.pluck(std, 'x');
      var ys = _.pluck(std, 'y');
      var standardScale = d3.scale.linear().domain(xs).range(ys);
      var resultY = standardScale(test._cartridge.result);
      console.log(test._cartridge.result, resultY);

      xs.splice(0, 0, 'Standard Curve X');
      ys.splice(0, 0, 'Standard Curve');

      var chart = c3.generate({
          bindto: '#testgraph' + index,
          padding: {
              top: 10,
              right: 40,
              bottom: 10,
              left: 30,
          },
          data: {
            xs: {
              'Standard Curve': 'Standard Curve X',
              'This Test': 'This Test X'
            },
            columns: [
              xs, ['This Test X', test._cartridge.result],
              ys, ['This Test', resultY]
            ],
            type: 'spline',
            axes: {
              'Standard Curve': 'y'
            }
          },
          zoom: {
            enabled: true
          },
          point: {
            r: function(d) {
                if (d.id === 'This Test') {
                  return 10;
                }
                else {
                  return 1;
                }
              }
          },
          legend: {
            position: 'bottom'
          },
          axis: {
            x1: {
              label: 'Standard Curve',
              type: 'linear',
              count: 8
            },
            x2: {
              label: 'This Test',
              type: 'linear',
              count: 8
            },
            y: {
              label: 'Test Results'
            }
          },
          regions: [
            {axis: 'y', end: cuts[0], class: 'positive'},
            {axis: 'y', start: cuts[0], end: cuts[1], class: 'borderline'},
            {axis: 'y', start: cuts[1], end: cuts[2], class: 'negative'},
            {axis: 'y', start: cuts[2], end: cuts[3], class: 'borderline'},
            {axis: 'y', start: cuts[3], class: 'positive'}
          ]
      });
    };

    $scope.currentPage = 0;
		$scope.pageChanged = function() {
			console.log($scope.currentPage);
			$scope.load();
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
        standardCurve: test._assay.standardCurve,
        percentComplete: test.percentComplete,
        status: test.status
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
  }
]);
