'use strict';

//Setting up route
angular.module('healthcare-providers').config(['$stateProvider',
	function($stateProvider) {
		// Healthcare providers state routing
		$stateProvider.
		state('listHealthcareProviders', {
			url: '/healthcare-providers',
			templateUrl: 'modules/healthcare-providers/views/list-healthcare-providers.client.view.html'
		}).
		state('createHealthcareProvider', {
			url: '/healthcare-providers/create',
			templateUrl: 'modules/healthcare-providers/views/create-healthcare-provider.client.view.html'
		}).
		state('viewHealthcareProvider', {
			url: '/healthcare-providers/:healthcareProviderId',
			templateUrl: 'modules/healthcare-providers/views/view-healthcare-provider.client.view.html'
		}).
		state('editHealthcareProvider', {
			url: '/healthcare-providers/:healthcareProviderId/edit',
			templateUrl: 'modules/healthcare-providers/views/edit-healthcare-provider.client.view.html'
		});
	}
]);