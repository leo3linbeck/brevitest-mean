'use strict';

var _ = window._;

// Prescriptions controller
angular.module('prescriptions').controller('PrescriptionsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Prescriptions', 'Assays',
	function($scope, $stateParams, $location, Authentication, Prescriptions, Assays) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

		$scope.openedPres = false;
		$scope.openedDOB = false;

		$scope.prescriptionAssays = [];
		$scope.assays = Assays.query();

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
			var indx = _.findIndex($scope.prescriptionAssays, function(e) {return (e._id === id);});
			if (indx === -1) {
				indx = _.findIndex($scope.assays, function(e) {return (e._id === id);});
				$scope.prescriptionAssays.push($scope.assays[indx]);
				$scope.assays.splice(indx, 1);
				$scope.prescriptionAssays.sort(assaySort);
				$scope.assays.sort(assaySort);
			}
		};

		$scope.removePrescribedAssay = function(id) {
			var indx = _.findIndex($scope.prescriptionAssays, function(e) {return (e._id === id);});
			$scope.assays.push($scope.prescriptionAssays[indx]);
			$scope.prescriptionAssays.splice(indx, 1);
			$scope.prescriptionAssays.sort(assaySort);
			$scope.assays.sort(assaySort);
		};

		// Create new Prescription
		$scope.create = function() {
			// Create new Prescription object
			var prescription = new Prescriptions ({
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
				$location.path('#!');
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Prescription
		$scope.remove = function(prescription) {
			if ( prescription ) {
				prescription.$remove();

				for (var i in $scope.prescriptions) {
					if ($scope.prescriptions [i] === prescription) {
						$scope.prescriptions.splice(i, 1);
					}
				}
			} else {
				$scope.prescription.$remove(function() {
					$location.path('prescriptions');
				});
			}
		};

		// Update existing Prescription
		$scope.update = function() {
			var prescription = $scope.prescription;
			prescription._assays = _.pluck($scope.prescriptionAssays, '_id');
			console.log(prescription);
			prescription.$update(function() {
				$location.path('/prescriptions/' + prescription._id);
				console.log(prescription);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
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
