'use strict';

// Configuring the Articles module
angular.module('providers').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Providers', 'providers', 'dropdown', '/providers(/create)?');
		Menus.addSubMenuItem('topbar', 'providers', 'List Providers', 'providers');
		Menus.addSubMenuItem('topbar', 'providers', 'New Provider', 'providers/create');
	}
]);