'use strict';

//Healthcare providers service used to communicate Healthcare providers REST endpoints
angular.module('healthcare-providers').factory('HealthcareProviders', ['$resource',
	function($resource) {
		return $resource('healthcare-providers/:healthcareProviderId', { healthcareProviderId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);