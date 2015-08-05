'use strict';

//Device pools service used to communicate Device pools REST endpoints
angular.module('device-pools').factory('DevicePools', ['$resource',
	function($resource) {
		return $resource('device-pools/:devicePoolId', { devicePoolId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);