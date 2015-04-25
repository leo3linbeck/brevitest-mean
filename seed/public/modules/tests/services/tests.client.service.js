'use strict';

//Tests service used to communicate Tests REST endpoints
angular.module('tests').factory('Tests', ['$resource',
	function($resource) {
		return $resource('tests/:testId', { testId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);