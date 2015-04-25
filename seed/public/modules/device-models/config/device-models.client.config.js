'use strict';

// Configuring the Articles module
angular.module('device-models').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Device models', 'device-models', 'dropdown', '/device-models(/create)?');
		Menus.addSubMenuItem('topbar', 'device-models', 'List Device models', 'device-models');
		Menus.addSubMenuItem('topbar', 'device-models', 'New Device model', 'device-models/create');
	}
]);