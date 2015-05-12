'use strict';

// Sparks controller
angular.module('sparks').controller('SparksController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Sparks',
  function($scope, $http, $stateParams, $location, Authentication, Sparks) {
      $scope.authentication = Authentication;

      $scope.alerts = [];
  		$scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
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
        if (spark) {
          spark.$remove();

          for (var i in $scope.sparks) {
            if ($scope.sparks[i] === spark) {
              $scope.sparks.splice(i, 1);
            }
          }
        }
        else {
          $scope.spark.$remove(function() {
            $location.path('sparks');
          });
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
        $http.get('/sparks/refresh').
  				success(function(data, status, headers, config) {
  					$scope.sparks = data;
  					$scope.alerts.push({type: 'success', msg: 'Spark list refreshed'});
  			  }).
  			  error(function(err, status, headers, config) {
  					console.log(err, status, headers(), config);
  					$scope.deviceInitialized = false;
  					$scope.alerts.push({type: 'danger', msg: err.message});
  			  });

  			$scope.alerts.push({type: 'info', msg: 'Spark refresh begun'});
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
