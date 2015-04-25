'use strict';

//Setting up route
angular.module('assays').config(['$stateProvider',
	function($stateProvider) {
		// Assays state routing
		$stateProvider.
		state('listAssays', {
			url: '/assays',
			templateUrl: 'modules/assays/views/list-assays.client.view.html'
		}).
		state('createAssay', {
			url: '/assays/create',
			templateUrl: 'modules/assays/views/create-assay.client.view.html'
		}).
		state('viewAssay', {
			url: '/assays/:assayId',
			templateUrl: 'modules/assays/views/view-assay.client.view.html'
		}).
		state('editAssay', {
			url: '/assays/:assayId/edit',
			templateUrl: 'modules/assays/views/edit-assay.client.view.html'
		});
	}
]);