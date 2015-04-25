'use strict';

//Cartridges service used to communicate Cartridges REST endpoints
angular.module('cartridges').factory('Cartridges', ['$resource',
	function($resource) {
		return $resource('cartridges/:cartridgeId', { cartridgeId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);