'use strict';

// Configuring the Articles module
angular.module('manufacturers').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Manufacturers', 'manufacturers', 'dropdown', '/manufacturers(/create)?');
		Menus.addSubMenuItem('topbar', 'manufacturers', 'List Manufacturers', 'manufacturers');
		Menus.addSubMenuItem('topbar', 'manufacturers', 'New Manufacturer', 'manufacturers/create');
	}
]);