'use strict';

//Setting up route
angular.module('sparks').config(['$stateProvider',
	function($stateProvider) {
		// Sparks state routing
		$stateProvider.
		state('listSparks', {
			url: '/sparks',
			templateUrl: 'modules/sparks/views/list-sparks.client.view.html'
		}).
		state('createSpark', {
			url: '/sparks/create',
			templateUrl: 'modules/sparks/views/create-spark.client.view.html'
		}).
		state('viewSpark', {
			url: '/sparks/:sparkId',
			templateUrl: 'modules/sparks/views/view-spark.client.view.html'
		}).
		state('editSpark', {
			url: '/sparks/:sparkId/edit',
			templateUrl: 'modules/sparks/views/edit-spark.client.view.html'
		});
	}
]);