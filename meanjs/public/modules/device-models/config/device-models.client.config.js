'use strict';

// Configuring the Articles module
angular.module('device-models').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Models', 'device-models', 'dropdown', '/device-models(/create)?');
		Menus.addSubMenuItem('topbar', 'device-models', 'List Brevitest™ models', 'device-models');
		Menus.addSubMenuItem('topbar', 'device-models', 'New Brevitest™ model', 'device-models/create');
	}
]);
