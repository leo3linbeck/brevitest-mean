'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('Superusers', ['$resource',
	function($resource) {
		return $resource('users/:userId', { userId: '@_id'
        }, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
