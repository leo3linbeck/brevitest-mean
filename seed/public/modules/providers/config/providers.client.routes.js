'use strict';

//Setting up route
angular.module('providers').config(['$stateProvider',
	function($stateProvider) {
		// Providers state routing
		$stateProvider.
		state('listProviders', {
			url: '/providers',
			templateUrl: 'modules/providers/views/list-providers.client.view.html'
		}).
		state('createProvider', {
			url: '/providers/create',
			templateUrl: 'modules/providers/views/create-provider.client.view.html'
		}).
		state('viewProvider', {
			url: '/providers/:providerId',
			templateUrl: 'modules/providers/views/view-provider.client.view.html'
		}).
		state('editProvider', {
			url: '/providers/:providerId/edit',
			templateUrl: 'modules/providers/views/edit-provider.client.view.html'
		});
	}
]);