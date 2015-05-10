'use strict';

// Configuring the Articles module
angular.module('assays').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Assays', 'assays', 'dropdown', '/assays(/create)?');
		Menus.addSubMenuItem('topbar', 'assays', 'List Assays', 'assays');
		Menus.addSubMenuItem('topbar', 'assays', 'New Assay', 'assays/create');
	}
]);
