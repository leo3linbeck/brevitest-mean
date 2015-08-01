'use strict';

// Manufacturers controller
angular.module('manufacturers').controller('ManufacturersController', ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'Manufacturers',
  function($scope, $stateParams, $location, $window, Authentication, Manufacturers) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.addresses = [];
    $scope.addressTypes = ['Main', 'Business', 'Operations', 'Other'];
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

    // Create new Manufacturer
    $scope.create = function() {
      // Create new Manufacturer object
      var manufacturer = new Manufacturers({
        name: this.name,
        addresses: this.addresses
      });

      // Redirect after save
      manufacturer.$save(function(response) {
        $location.path('manufacturers');

        // Clear form fields
        $scope.name = '';
        $scope.addresses = [];
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Manufacturer
    $scope.remove = function(manufacturer) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (manufacturer) {
          manufacturer.$remove();

          for (var i in $scope.manufacturers) {
            if ($scope.manufacturers[i] === manufacturer) {
              $scope.manufacturers.splice(i, 1);
            }
          }
        } else {
          $scope.manufacturer.$remove(function() {
            $location.path('manufacturers');
          });
        }
      }
    };

    // Update existing Manufacturer
    $scope.update = function() {
      var manufacturer = $scope.manufacturer;

      manufacturer.addresses = $scope.addresses;
      manufacturer.$update(function() {
        $location.path('manufacturers');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Manufacturers
    $scope.find = function() {
      $scope.manufacturers = Manufacturers.query();
    };

    // Find existing Manufacturer
    $scope.findOne = function() {
      $scope.manufacturer = Manufacturers.get({
        manufacturerId: $stateParams.manufacturerId
      }, function() {
        $scope.addresses = $scope.manufacturer.addresses.length ? $scope.manufacturer.addresses : $scope.addresses;
      });
    };
  }
]);
