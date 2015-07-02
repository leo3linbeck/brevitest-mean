'use strict';


angular.module('core').controller('HomeController', ['$scope', '$location', 'Authentication', 'Notification',
	function($scope, $location, Authentication, Notification) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
		if (!$scope.authentication.user) {
			$location.path('/signin');
		}

		$scope.showDetail = false;

        // disable JSHint error: 'confusing user of !'
        /*jshint -W018 */
        console.log($scope.authentication.user.roles);
        if (!($scope.authentication.user.roles.indexOf('user') > -1) && $scope.authentication.user) {
            Notification.error('You do not currently have user privileges. Functionality will be extremely limited. Please contact an administrator and request user privileges.');
        }
        /*jshint +W018 */

	}
]);
