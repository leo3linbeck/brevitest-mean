'use strict';

//Providers service used to communicate Providers REST endpoints
angular.module('providers').factory('Providers', ['$resource',
	function($resource) {
		return $resource('providers/:providerId', { providerId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);