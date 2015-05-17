'use strict';

// Tests controller
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', 'Tests', 'Sparks', 'Notification',
  function($scope, $http, Tests, Sparks, Notification) {

    $scope.setup = function() {
      $http.get('/tests/review').
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.tests = data;
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
    };

    $scope.loadRawData = function(cartridgeID) {
      $http.post('/sparks/record_by_cartridge_id', {
        cartridgeID: cartridgeID
      }).
      success(function(data, status, headers, config) {
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

    $scope.chartType = 'line';

    $scope.data = {
      series: ['Red', 'Green', 'Blue', 'Clear'],
      data: [{
        x: '0',
        y: [10, 20, 30, 50],
        tooltip: 'RGB1'
      }, {
				x: '1',
				y: [30, 50, 60, 70],
        tooltip: 'RGB2'
			}, {
				x: '2',
				y: [40, 60, 70, 75],
        tooltip: 'RGB3'
			}, {
				x: '3',
				y: [45, 65, 75, 80],
        tooltip: 'RGB4'
      }]
    };

    $scope.config = {
      title: 'Test Data',
      tooltips: true,
      labels: false,
      mouseover: function() {
        return;
      },
      mouseout: function() {
        return;
      },
      click: function() {
        return;
      },
      legend: {
        display: false,
        position: 'right',
        htmlEnabled: false
      },
      colors: ['red', 'green', 'blue', 'black'],
      lineLegend: 'lineEnd',
      lineCurveType: 'cardinal',
      isAnimate: true,
      yAxisTickFormat: 's',
      xAxisMaxTicks: 7,
      xAxisTickFormat: 's',
      waitForHeightAndWidth: true
    };

    $scope.selectedTest = -1;
    $scope.clickTest = function(indx) {
      $scope.selectedTest = indx;
    };
  }
]);
