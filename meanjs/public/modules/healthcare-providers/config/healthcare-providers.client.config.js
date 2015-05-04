'use strict';

// Configuring the Articles module
angular.module('healthcare-providers').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Healthcare providers', 'healthcare-providers', 'dropdown', '/healthcare-providers(/create)?');
		Menus.addSubMenuItem('topbar', 'healthcare-providers', 'List Healthcare providers', 'healthcare-providers');
		Menus.addSubMenuItem('topbar', 'healthcare-providers', 'New Healthcare provider', 'healthcare-providers/create');
	}
]);