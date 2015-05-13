'use strict';

// Configuring the Articles module
angular.module('sparks').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Sparks', 'sparks', 'dropdown', '/sparks(/create)?');
		Menus.addSubMenuItem('topbar', 'sparks', 'List Sparks', 'sparks');
		Menus.addSubMenuItem('topbar', 'sparks', 'New Spark', 'sparks/create');
	}
]);
