'use strict';

//Setting up route
angular.module('firmware-tests').config(['$stateProvider',
	function($stateProvider) {
		// Firmware tests state routing
		$stateProvider.
		state('listFirmwareTests', {
			url: '/firmware-tests',
			templateUrl: 'modules/firmware-tests/views/list-firmware-tests.client.view.html'
		}).
		state('createFirmwareTest', {
			url: '/firmware-tests/create',
			templateUrl: 'modules/firmware-tests/views/create-firmware-test.client.view.html'
		}).
		state('viewFirmwareTest', {
			url: '/firmware-tests/:firmwareTestId',
			templateUrl: 'modules/firmware-tests/views/view-firmware-test.client.view.html'
		}).
		state('editFirmwareTest', {
			url: '/firmware-tests/:firmwareTestId/edit',
			templateUrl: 'modules/firmware-tests/views/edit-firmware-test.client.view.html'
		});
	}
]);