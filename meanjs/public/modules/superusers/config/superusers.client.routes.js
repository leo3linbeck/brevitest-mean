'use strict';

//Setting up route
angular.module('superusers').config(['$stateProvider',
	function($stateProvider) {
		// Superusers state routing
		$stateProvider.
		state('listSuperusers', {
			url: '/superusers',
			templateUrl: 'modules/superusers/views/list-superusers.client.view.html'
		}).
		state('viewSuperuser', {
			url: '/superusers/:userId',
			templateUrl: 'modules/superusers/views/view-superuser.client.view.html'
		}).
		state('editSuperuser', {
			url: '/superusers/:userId/edit',
			templateUrl: 'modules/superusers/views/edit-superuser.client.view.html'
		});
	}
]);
