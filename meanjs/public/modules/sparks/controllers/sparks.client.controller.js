'use strict';

// Sparks controller
angular.module('sparks').controller('SparksController', ['$scope', '$http', '$stateParams', '$location', '$timeout', '$window', 'Authentication', 'Sparks', 'Notification',
  function($scope, $http, $stateParams, $location, $timeout, $window, Authentication, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.eraseArchivedData = function() {
      $http.post('/sparks/erase_archived_data', {
        spark: $scope.spark
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        if (data.return_value === 1) {
          Notification.success('Archive erased');
        }
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });
    };

    $scope.getNumberOfRecords = function() {
      $http.post('/sparks/archive_size', {
        spark: $scope.spark
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        if (data.return_value !== -1) {
          Notification.success('Archive contains ' + data.return_value + ' records');
        }
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });
    };

    $scope.getFirstRecord = function() {
      $http.post('/sparks/record_by_index', {
        spark: $scope.spark,
        index: 0
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.rawData = JSON.parse(data);
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });
    };

    $scope.reflash = function() {
      $http.post('/sparks/reflash', {
        spark: $scope.spark
      }).
      success(function(data, status, headers, config) {
        Notification.success('Firmware flashed successfully');
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    // Create new Spark
    $scope.create = function() { // Create new Spark object
      var spark = new Sparks({
        name: this.name,
        sparkID: this.sparkID
      });

      // Redirect after save
      spark.$save(
        function(response) {
          $location.path('sparks/' + response._id);

          // Clear form fields
          $scope.name = '';
          $scope.sparkID = '';
        },
        function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });
    };

    // Remove existing Spark
    $scope.remove = function(spark) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (spark) {
          spark.$remove();

          for (var i in $scope.sparks) {
            if ($scope.sparks[i] === spark) {
              $scope.sparks.splice(i, 1);
            }
          }
        } else {
          $scope.spark.$remove(function() {
            $location.path('sparks');
          });
        }
      }
    };

    // Update existing Spark
    $scope.update = function() {
      var spark = $scope.spark;

      spark.$update(
        function() {
          $location.path('sparks/' + spark._id);
        },
        function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });
    };

    // Refresh a list of Sparks
    $scope.refresh = function() {
      console.log('Refreshing device list');
      $http.get('/sparks/refresh').
      success(function(data, status, headers, config) {
        $scope.sparks = data;
        Notification.success('Spark list refreshed');
        // addAlert($scope.alerts, 'success', 'Spark list refreshed');
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    // Find a list of Sparks
    $scope.find = function() {
      $scope.sparks = Sparks.query();
    };

    // Find existing Spark
    $scope.findOne = function() {
      $scope.spark = Sparks.get({
        sparkId: $stateParams.sparkId
      });
    };
  }
]);
