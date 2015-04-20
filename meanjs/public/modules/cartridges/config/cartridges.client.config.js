'use strict';

// Configuring the Articles module
angular.module('cartridges').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Cartridges', 'cartridges', 'dropdown', '/cartridges(/create)?');
		Menus.addSubMenuItem('topbar', 'cartridges', 'List Cartridges', 'cartridges');
		Menus.addSubMenuItem('topbar', 'cartridges', 'New Cartridge', 'cartridges/create');
	}
]);