'use strict';

//Setting up route
angular.module('device-models').config(['$stateProvider',
	function($stateProvider) {
		// Device models state routing
		$stateProvider.
		state('listDeviceModels', {
			url: '/device-models',
			templateUrl: 'modules/device-models/views/list-device-models.client.view.html'
		}).
		state('createDeviceModel', {
			url: '/device-models/create',
			templateUrl: 'modules/device-models/views/create-device-model.client.view.html'
		}).
		state('viewDeviceModel', {
			url: '/device-models/:deviceModelId',
			templateUrl: 'modules/device-models/views/view-device-model.client.view.html'
		}).
		state('editDeviceModel', {
			url: '/device-models/:deviceModelId/edit',
			templateUrl: 'modules/device-models/views/edit-device-model.client.view.html'
		});
	}
]);