'use strict';

//Device models service used to communicate Device models REST endpoints
angular.module('device-models').factory('DeviceModels', ['$resource',
	function($resource) {
		return $resource('device-models/:deviceModelId', { deviceModelId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);