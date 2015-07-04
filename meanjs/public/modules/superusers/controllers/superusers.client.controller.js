'use strict';

// Superusers controller
angular.module('superusers').controller('SuperusersController', ['$scope', '$stateParams', '$window', '$location', 'Authentication', 'Superusers', '$timeout', 'Notification',
	function($scope, $stateParams, $window, $location, Authentication, Superusers, $timeout, Notification) {
		$scope.authentication = Authentication;

		// Create new Superuser
		$scope.create = function() {
			// Create new Superuser object
			var superuser = new Superusers ({
				name: this.name
			});

			// Redirect after save
			superuser.$save(function(response) {
				$location.path('superusers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Superuser
        $scope.remove = function(superuser) {
            /*global swal */ //http://stackoverflow.com/questions/11957977/how-to-fix-foo-is-not-defined-error-reported-by-jslint
            swal({
                    title: 'Are you sure?',
                    text: 'Your will not be able to recover this imaginary file!',
                    type: 'error',
                    showCancelButton: true,
                    confirmButtonColor: '#d9534f',
                    confirmButtonText: 'Yes, delete it!',
                    cancelButtonText: 'No, cancel it!',
                    closeOnConfirm: true,
                    closeOnCancel: true
                },
                function(confirmed){
                    if (confirmed) {
                        if (superuser) {  // if there is a superuser to be deleted...
                            superuser.$remove(function (response) {
                                if(response.error) {
                                    Notification.error(response.error);
                                    $scope.superuser = response.superuser;
                                }
                                else {
                                    for (var i in $scope.superusers) {
                                        if ($scope.superusers [i] === superuser) {
                                            $scope.superusers.splice(i, 1);
                                        }
                                    }
                                    $location.path('superusers');
                                }

                            });
                        } else {    // if there is no superuser to be deleted...
                            $scope.superuser.$remove(function () {
                                $location.path('superusers');  // redirect to the list superusers page
                            });
                        }
                    }
                });
        };


        // Update existing Superuser
		$scope.update = function() {
            var roles = [];

            if ($scope.checkModel.user === true)
                roles.push('user');
            if ($scope.checkModel.admin === true)
                roles.push('admin');
            if ($scope.checkModel.superuser === true)
                roles.push('superuser');

            var superuser = $scope.superuser;

            superuser.roles = roles;

            console.log('update');
			superuser.$update(function() {
				$location.path('superusers/' + superuser._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Superusers
		$scope.find = function() {
			$scope.superusers = Superusers.query();
		};

		// Find existing Superuser
		$scope.findOne = function() {
			$scope.superuser = Superusers.get({
				userId: $stateParams.userId
			});
            $timeout(function () {
                console.log($scope.superuser.roles);
                $scope.checkModel = {
                    user: $scope.superuser.roles.indexOf('user') > -1,
                    admin: $scope.superuser.roles.indexOf('admin') > -1,
                    superuser: $scope.superuser.roles.indexOf('superuser') > -1
                };
            }, 500);

		};
	}
]);
