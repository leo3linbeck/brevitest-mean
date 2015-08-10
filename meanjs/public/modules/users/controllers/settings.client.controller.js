'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Organizations', 'Authentication',
	function($scope, $http, $location, Users, Organizations, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		$scope.organizations = Organizations.query();
		$scope.selectOrganization = function(indx) {
			$scope.user._organization = $scope.organizations[indx]._id;
		};

		// Check if there are additional accounts
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}
			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
					$location.path('/');
					/*global swal */
					swal({title: '', text: '<b>' + $scope.user.firstName + ' ' + $scope.user.lastName +  ' has been updated!</b>', type: 'success', confirmButtonColor: '#5cb85c', html: true});
				}, function(response) {
					/*global swal */
					swal({title: '', text: '<b>' + response.data.message + '</b>', type: 'error', confirmButtonColor: 'rgb(242,116,116)', html: true});
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
				$location.path('/');
				/*global swal */
				swal({title: '', text: '<b>' + Authentication.user.firstName + ' ' + Authentication.user.lastName +  '\'s password has been updated!</b>', type: 'success', confirmButtonColor: '#5cb85c', html: true});
			}).error(function(response) {
				/*global swal */
				swal({title: '', text: '<b>' + response.message + '</b>', type: 'error', confirmButtonColor: 'rgb(242,116,116)', html: true});
			});
		};
	}
]);
