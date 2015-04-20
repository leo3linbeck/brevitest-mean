'use strict';

//Manufacturers service used to communicate Manufacturers REST endpoints
angular.module('manufacturers').factory('Manufacturers', ['$resource',
	function($resource) {
		return $resource('manufacturers/:manufacturerId', { manufacturerId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);