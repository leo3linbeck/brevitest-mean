'use strict';

//Setting up route
angular.module('manufacturers').config(['$stateProvider',
	function($stateProvider) {
		// Manufacturers state routing
		$stateProvider.
		state('listManufacturers', {
			url: '/manufacturers',
			templateUrl: 'modules/manufacturers/views/list-manufacturers.client.view.html'
		}).
		state('createManufacturer', {
			url: '/manufacturers/create',
			templateUrl: 'modules/manufacturers/views/create-manufacturer.client.view.html'
		}).
		state('viewManufacturer', {
			url: '/manufacturers/:manufacturerId',
			templateUrl: 'modules/manufacturers/views/view-manufacturer.client.view.html'
		}).
		state('editManufacturer', {
			url: '/manufacturers/:manufacturerId/edit',
			templateUrl: 'modules/manufacturers/views/edit-manufacturer.client.view.html'
		});
	}
]);