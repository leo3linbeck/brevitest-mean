'use strict';

var _ = window._;

// Prescriptions controller
angular.module('prescriptions').controller('PrescriptionsController', ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'Prescriptions', 'Assays', 'Notification',
  function($scope, $stateParams, $location, $window, Authentication, Prescriptions, Assays, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.openedPres = false;
    $scope.openedDOB = false;

    $scope.prescriptionAssays = [];
    $scope.assays = Assays.query();
    $scope.prescribedOn = new Date();

    $scope.openDatepicker = function($event, dateField) {
      $event.preventDefault();
      $event.stopPropagation();

      switch (dateField) {
        case 'pres':
          $scope.openedPres = !$scope.openedPres;
          break;
        case 'dob':
          $scope.openedDOB = !$scope.openedDOB;
          break;
      }
    };

    function assaySort(a, b) {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    }

    $scope.prescribeAssay = function(id) {
      var indx = _.findIndex($scope.prescriptionAssays, function(e) {
        return (e._id === id);
      });
      if (indx === -1) {
        indx = _.findIndex($scope.assays, function(e) {
          return (e._id === id);
        });
        $scope.prescriptionAssays.push($scope.assays[indx]);
        $scope.assays.splice(indx, 1);
        $scope.prescriptionAssays.sort(assaySort);
        $scope.assays.sort(assaySort);
      }
    };

    $scope.removePrescribedAssay = function(id) {
      var indx = _.findIndex($scope.prescriptionAssays, function(e) {
        return (e._id === id);
      });
      $scope.assays.push($scope.prescriptionAssays[indx]);
      $scope.prescriptionAssays.splice(indx, 1);
      $scope.prescriptionAssays.sort(assaySort);
      $scope.assays.sort(assaySort);
    };

    // Create new Prescription
    $scope.create = function() {
      // Create new Prescription object
      var prescription = new Prescriptions({ // prescriptions is new resource object
        name: this.name,
        prescribedOn: this.prescribedOn,
        comments: this.comments,
        patientNumber: this.patientNumber,
        patientGender: this.patientGender,
        patientDateOfBirth: this.patientDateOfBirth,
        _assays: _.pluck(this.prescriptionAssays, '_id')
      });

      // Redirect after save
      prescription.$save(function(response) {
        $location.path('/prescriptions');
          /*global swal */
          swal({title:'Success!', text: 'Prescription ' + response.name +  ' has been created', type: 'success', confirmButtonColor: '#5cb85c'});
      }, function(errorResponse) {
        Notification.error(errorResponse.data.message);
      });
    };

    // Remove existing Prescription
    //$scope.remove = function(prescription) {
    //    console.log(prescription);
    //    console.log($scope.prescription);
    //  if ($window.confirm('Are you sure you want to delete this record?')) {
    //    if (prescription) {
    //      prescription.$remove();
    //      for (var i in $scope.prescriptions) {
    //        if ($scope.prescriptions[i] === prescription) {
    //          $scope.prescriptions.splice(i, 1);
    //        }
    //      }
    //    } else {
    //      $scope.prescription.$remove(function() {
    //        $location.path('prescriptions');
    //      });
    //    }
    //  }
    //};

      $scope.apiCall = function (callFunc, callParams, useSwal, swalParams) {
          useSwal = typeof useSwal !== 'undefined' ? useSwal : true; // if useAlerts is NOT undefined set it equal to the value passed, otherwise false
          if (useSwal) {
              swal({title: swalParams.title, text: swalParams.text, type: swalParams.type, showCancelButton: swalParams.showCancelButton, confirmButtonColor: swalParams.confirmButtonColor, confirmButtonText: swalParams.confirmButtonText, cancelButtonText: swalParams.cancelButtonText, closeOnConfirm: swalParams.closeOnConfirm, closeOnCancel: swalParams.closeOnCancel}, function (confirmed) {
                  if (!confirmed)
                      return;

                  callFunc(callParams);
              });
          } else
              callFunc(callParams);
      };

      $scope.remove = function(prescription) {
          if (prescription) {
              prescription.$remove();
              for (var i in $scope.prescriptions) {
                  if ($scope.prescriptions[i] === prescription) {
                      $scope.prescriptions.splice(i, 1);
                  }
              }
          } else {
              $scope.prescription.$remove(function(response) {
                  $location.path('prescriptions');
                  if (response.error) {
                      swal({title:'Oops!', text: 'You don\'t have permission to delete this prescription', type: 'error', timer:0});
                      Notification.error(response.error);
                  }
                  else {
                      swal({title: 'Success!', text: 'Prescription has been deleted!', type: 'success', confirmButtonColor: '#5cb85c'});
                  }
              });
          }
      };

      //$scope.remove = function(prescription) {
      //    /*global swal */
      //    swal({
      //        title: 'Are you sure?',
      //        text: 'Your will not be able to recover this prescription!',
      //        type: 'error',
      //        showCancelButton: true,
      //        confirmButtonColor: '#d9534f',
      //        confirmButtonText: 'Yes, delete it!',
      //        cancelButtonText: 'No, cancel it!',
      //        closeOnConfirm: false,
      //        closeOnCancel: true,
      //        allowOutsideClick: true
      //    }, function (confirmed) {
      //        if (confirmed) {
      //            if (prescription) {
      //                prescription.$remove();
      //                for (var i in $scope.prescriptions) {
      //                    if ($scope.prescriptions[i] === prescription) {
      //                        $scope.prescriptions.splice(i, 1);
      //                    }
      //                }
      //            } else {
      //                $scope.prescription.$remove(function(response) {
      //                    $location.path('prescriptions');
      //                    if (response.error) {
      //                        swal({title:'Oops!', text: 'You don\'t have permission to delete this prescription', type: 'error', timer:0});
      //                        Notification.error(response.error);
      //                    }
      //                    else {
      //                        swal({title: 'Success!', text: 'Prescription has been deleted!', type: 'success', confirmButtonColor: '#5cb85c'});
      //                    }
      //                });
      //            }
      //        }
      //    });
      //};

    // Update existing Prescription
    $scope.update = function() {
      var prescription = $scope.prescription;
      prescription._assays = _.pluck($scope.prescriptionAssays, '_id');
      console.log(prescription);
      prescription.$update(function() {
        $location.path('/prescriptions/' + prescription._id);
        console.log(prescription);
      }, function(errorResponse) {
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
      });
    };

    // Find a list of Prescriptions
    $scope.find = function() {
      $scope.prescriptions = Prescriptions.query();
    };

    // Find existing Prescription
    $scope.findOne = function() {
      $scope.prescription = Prescriptions.get({
        prescriptionId: $stateParams.prescriptionId
      }, function() {
        if ($scope.prescription._assays && $scope.prescription._assays.length) {
          $scope.prescription._assays.forEach(function(e) {
            $scope.prescribeAssay(e._id);
          });
        }
      });
    };
  }
]);
