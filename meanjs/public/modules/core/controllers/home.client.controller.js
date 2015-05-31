'use strict';


angular.module('core').controller('HomeController', ['$scope', '$location', 'Authentication', 'Notification',
	function($scope, $location, Authentication, Notification) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
		if ($scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}
	}
]);
