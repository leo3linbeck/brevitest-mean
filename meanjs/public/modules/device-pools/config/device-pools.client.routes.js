'use strict';

//Setting up route
angular.module('device-pools').config(['$stateProvider',
	function($stateProvider) {
		// Device pools state routing
		$stateProvider.
		state('listDevicePools', {
			url: '/device-pools',
			templateUrl: 'modules/device-pools/views/list-device-pools.client.view.html'
		}).
		state('createDevicePool', {
			url: '/device-pools/create',
			templateUrl: 'modules/device-pools/views/create-device-pool.client.view.html'
		}).
		state('selectDevicePool', {
			url: '/device-pools/select',
			templateUrl: 'modules/device-pools/views/select-device-pool.client.view.html'
		}).
		state('viewDevicePool', {
			url: '/device-pools/:devicePoolId',
			templateUrl: 'modules/device-pools/views/view-device-pool.client.view.html'
		}).
		state('editDevicePool', {
			url: '/device-pools/:devicePoolId/edit',
			templateUrl: 'modules/device-pools/views/edit-device-pool.client.view.html'
		});
	}
]);
