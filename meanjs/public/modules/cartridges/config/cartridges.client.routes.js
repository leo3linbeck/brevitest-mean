'use strict';

//Setting up route
angular.module('cartridges').config(['$stateProvider',
	function($stateProvider) {
		// Cartridges state routing
		$stateProvider.
		state('listCartridges', {
			url: '/cartridges',
			templateUrl: 'modules/cartridges/views/list-cartridges.client.view.html'
		}).
		state('cartridgeLabels', {
			url: '/cartridges/labels',
			templateUrl: 'modules/cartridges/views/labels-cartridges.client.view.html'
		}).
		state('loadCartridges', {
			url: '/cartridges/load',
			templateUrl: 'modules/cartridges/views/list-cartridges.client.view.html'
		}).
		state('createCartridge', {
			url: '/cartridges/create',
			templateUrl: 'modules/cartridges/views/create-cartridge.client.view.html'
		}).
		state('viewCartridge', {
			url: '/cartridges/:cartridgeId',
			templateUrl: 'modules/cartridges/views/view-cartridge.client.view.html'
		}).
		state('editCartridge', {
			url: '/cartridges/:cartridgeId/edit',
			templateUrl: 'modules/cartridges/views/edit-cartridge.client.view.html'
		});
	}
]);
