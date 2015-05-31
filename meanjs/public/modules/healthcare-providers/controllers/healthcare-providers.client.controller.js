'use strict';

// Healthcare providers controller
angular.module('healthcare-providers').controller('HealthcareProvidersController', ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'HealthcareProviders',
  function($scope, $stateParams, $location, $window, Authentication, HealthcareProviders) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    $scope.addresses = [];
    $scope.addressTypes = ['Main', 'Business', 'Clinic', 'Other'];
    $scope.addressTypes.forEach(function(a) {
      $scope.addresses.push({
        location: a,
        street1: '',
        street2: '',
        city: '',
        state: '',
        zipcode: ''
      });
    });

    // Create new Healthcare provider
    $scope.create = function() {
      // Create new Healthcare provider object
      var healthcareProvider = new HealthcareProviders({
        name: this.name,
        addresses: this.addresses
      });

      // Redirect after save
      healthcareProvider.$save(function(response) {
        $location.path('healthcare-providers/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.addresses = [];
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Healthcare provider
    $scope.remove = function(healthcareProvider) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (healthcareProvider) {
          healthcareProvider.$remove();

          for (var i in $scope.healthcareProviders) {
            if ($scope.healthcareProviders[i] === healthcareProvider) {
              $scope.healthcareProviders.splice(i, 1);
            }
          }
        } else {
          $scope.healthcareProvider.$remove(function() {
            $location.path('healthcare-providers');
          });
        }
      }
    };

    // Update existing Healthcare provider
    $scope.update = function() {
      var healthcareProvider = $scope.healthcareProvider;

      healthcareProvider.addresses = $scope.addresses;
      healthcareProvider.$update(function() {
        $location.path('healthcare-providers/' + healthcareProvider._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Healthcare providers
    $scope.find = function() {
      $scope.healthcareProviders = HealthcareProviders.query();
    };

    // Find existing Healthcare provider
    $scope.findOne = function() {
      $scope.healthcareProvider = HealthcareProviders.get({
        healthcareProviderId: $stateParams.healthcareProviderId
      }, function() {
        $scope.addresses = $scope.healthcareProvider.addresses.length ? $scope.healthcareProvider.addresses : $scope.addresses;
      });
    };
  }
]);
