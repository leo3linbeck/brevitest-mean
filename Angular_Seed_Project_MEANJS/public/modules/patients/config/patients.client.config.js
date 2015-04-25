'use strict';

// Configuring the Articles module
angular.module('patients').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Patients', 'patients', 'dropdown', '/patients(/create)?');
		Menus.addSubMenuItem('topbar', 'patients', 'List Patients', 'patients');
		Menus.addSubMenuItem('topbar', 'patients', 'New Patient', 'patients/create');
	}
]);