'use strict';

// Superusers controller
angular.module('superusers').controller('SuperusersController', ['$scope', '$stateParams', '$window', '$location', 'Authentication', 'Superusers', 'Notification', 'swalConfirm',
    function ($scope, $stateParams, $window, $location, Authentication, Superusers, Notification, swalConfirm) {
        $scope.authentication = Authentication;

        $scope.remove = function (superuser) {
            swalConfirm.swal(superuser, function (superuser) {
                if (superuser) {  // if a superuser is passed
                    superuser.$remove(function (response) {
                        if (response.error) {
                            /*global swal */
                            swal({title: '', showConfirmButton: false, timer: 0}); // create an alert an close instantly to trick sweet alerts into thinking you displayed a followup alert
                            Notification.error(response.error);
                            $scope.superuser = response.superuser;
                        }
                        else {
                            /*global swal */
                            swal({title: 'Success!', text: 'User ' + superuser.displayName + ' has been deleted!', type: 'success', confirmButtonColor: '#5cb85c'});
                            for (var i in $scope.superusers) {
                                if ($scope.superusers [i] === superuser) {
                                    $scope.superusers.splice(i, 1);
                                }
                            }
                            $location.path('superusers');
                        }
                    });
                } else {    // if no superuser is passed use the scope superuser
                    $scope.superuser.$remove(function () {
                        $location.path('superusers');  // redirect to the list superusers page
                    });
                }
            },
                {title: 'Are you sure?', text: 'Your will not be able to recover this user!', type: 'error', showCancelButton: true, confirmButtonColor: '#d9534f', confirmButtonText: 'Yes, delete it!', cancelButtonText: 'No, cancel it!', closeOnConfirm: false, closeOnCancel: true}
            );
        };

        // Update existing Superuser
        $scope.update = function () {
            $scope.superuser.roles = [];

            if ($scope.checkModel.user === true)
                $scope.superuser.roles.push('user');
            if ($scope.checkModel.admin === true)
                $scope.superuser.roles.push('admin');
            if ($scope.checkModel.superuser === true)
                $scope.superuser.roles.push('superuser');

            $scope.superuser.$update(function (response) {
                $location.path('superusers/' + $scope.superuser._id);
            }, function (errorResponse) {
                $scope.error = errorResponse.data.message;
            });
            swal({title: 'Success!', text: $scope.superuser.displayName + ' has been updated!', type: 'success', confirmButtonColor: '#5cb85c'});
        };

        // Find a list of Superusers
        $scope.find = function () {
            $scope.superusers = Superusers.query();
        };

        // Find existing Superuser
        $scope.findOne = function () {
            $scope.superuser = Superusers.get({
                userId: $stateParams.userId
            }, function (response) {
                $scope.checkModel = {   // checkModel is bound to 3 buttons on the edit view used for changing user permissions
                    user: $scope.superuser.roles.indexOf('user') > -1,  // true if user has role 'user'
                    admin: $scope.superuser.roles.indexOf('admin') > -1, // true if user has role 'admin'
                    superuser: $scope.superuser.roles.indexOf('superuser') > -1 // true if user has role 'superuser'
                };
            });
        };
        
        $scope.hasRole = function (role) {
            if ($scope.superuser.roles) {
                return $scope.superuser.roles.indexOf('superuser') > -1;   
            }
        };
    }
]);
