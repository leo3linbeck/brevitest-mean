'use strict';

//Firmware tests service used to communicate Firmware tests REST endpoints
angular.module('firmware-tests').factory('FirmwareTests', ['$resource',
	function($resource) {
		return $resource('firmware-tests/:firmwareTestId', { firmwareTestId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);