'use strict';

//Setting up route
angular.module('tests').config(['$stateProvider',
	function($stateProvider) {
		// Tests state routing
		$stateProvider.
		state('listTests', {
			url: '/tests',
			templateUrl: 'modules/tests/views/list-tests.client.view.html'
		}).
		state('createTest', {
			url: '/tests/create',
			templateUrl: 'modules/tests/views/create-test.client.view.html'
		}).
		state('viewTest', {
			url: '/tests/:testId',
			templateUrl: 'modules/tests/views/view-test.client.view.html'
		}).
		state('editTest', {
			url: '/tests/:testId/edit',
			templateUrl: 'modules/tests/views/edit-test.client.view.html'
		});
	}
]);