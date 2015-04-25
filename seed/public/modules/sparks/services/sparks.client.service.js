'use strict';

//Sparks service used to communicate Sparks REST endpoints
angular.module('sparks').factory('Sparks', ['$resource',
	function($resource) {
		return $resource('sparks/:sparkId', { sparkId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);