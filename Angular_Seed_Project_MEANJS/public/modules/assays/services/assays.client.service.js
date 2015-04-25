'use strict';

//Assays service used to communicate Assays REST endpoints
angular.module('assays').factory('Assays', ['$resource',
	function($resource) {
		return $resource('assays/:assayId', { assayId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);