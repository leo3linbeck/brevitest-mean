'use strict';

// Configuring the Articles module
angular.module('core').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'View', 'view', 'dropdown', '');
		Menus.addSubMenuItem('topbar', 'view', 'Assays', 'assays');
		Menus.addSubMenuItem('topbar', 'view', 'Devices', 'devices');
		Menus.addSubMenuItem('topbar', 'view', 'Device Models', 'device-models');
		Menus.addSubMenuItem('topbar', 'view', 'Prescriptions', 'prescriptions');
		Menus.addSubMenuItem('topbar', 'view', 'Sparks', 'sparks');

		Menus.addMenuItem('topbar', 'Create', 'new', 'dropdown', '');
		Menus.addSubMenuItem('topbar', 'new', 'Assay', 'assays/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device', 'devices/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device Model', 'device-models/create');
		Menus.addSubMenuItem('topbar', 'new', 'Prescription', 'prescriptions/create');
		Menus.addSubMenuItem('topbar', 'new', 'Cartridge Labels', 'cartridges/labels');
			}
]);
