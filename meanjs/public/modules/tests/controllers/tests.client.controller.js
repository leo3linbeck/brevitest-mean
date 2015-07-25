'use strict';

// Tests controller
angular.module('tests').controller('TestsController', ['$scope', '$stateParams', '$location', '$http', '$window', 'Authentication', 'Tests', 'Assays',
  function($scope, $stateParams, $location, $http, $window, Authentication, Tests, Assays) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.showResultsOnOpen = true;

    // Create new Test
    $scope.create = function() {
      // Create new Test object
      var test = new Tests({
        reference: this.reference,
        subject: this.subject,
        description: this.description
      });

      // Redirect after save
      test.$save(function(response) {
        $location.path('tests/' + response._id);

        // Clear form fields
        $scope.reference = '';
        $scope.subject = '';
        $scope.description = '';
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Test
    $scope.remove = function(test) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (test) {
          test.$remove();

          for (var i in $scope.tests) {
            if ($scope.tests[i] === test) {
              $scope.tests.splice(i, 1);
            }
          }
        } else {
          $scope.test.$remove(function() {
            $location.path('tests');
          });
        }
      }
    };

    // Update existing Test
    $scope.update = function() {
      var test = $scope.test;

      test.$update(function() {
        $location.path('tests/' + test._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Tests
    $scope.find = function() {
      $scope.tests = Tests.query();
    };

    // Find existing Test
    $scope.findOne = function() {
      $scope.test = Tests.get({
        testId: $stateParams.testId
      });
    };
  }
]);
