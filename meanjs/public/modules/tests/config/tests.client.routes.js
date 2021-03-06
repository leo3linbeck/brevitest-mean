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
		state('loadTests', {
			url: '/tests/load',
			css: 'modules/tests/css/review-test.client.css',
			templateUrl: 'modules/tests/views/review-test.client.view.html'
		}).
		state('createTest', {
			url: '/tests/create',
			templateUrl: 'modules/tests/views/create-test.client.view.html'
		}).
		state('runTests', {
			url: '/tests/run',
			templateUrl: 'modules/tests/views/run-test.client.view.html'
		}).
		state('monitorTests', {
			url: '/tests/monitor',
			templateUrl: 'modules/tests/views/monitor-test.client.view.html'
		}).
		state('reviewTests', {
			url: '/tests/review',
			css: 'modules/tests/css/review-test.client.css',
			templateUrl: 'modules/tests/views/review-test.client.view.html'
		}).
		state('exportTests', {
			url: '/tests/export',
			templateUrl: 'modules/tests/views/export-test.client.view.html'
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
