'use strict';

// Configuring the Articles module
angular.module('core').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'View', 'view', 'dropdown', '', 'menu.isPublic', ['user']);
		Menus.addSubMenuItem('topbar', 'view', 'Assays', 'assays', '/assays', 'menu.isPublic');
		Menus.addSubMenuItem('topbar', 'view', 'Devices', 'devices', '/devices');
		Menus.addSubMenuItem('topbar', 'view', 'Device Pools', 'device-pools', '/device-pools');
		Menus.addSubMenuItem('topbar', 'view', 'Device Models', 'device-models', '/device-models');
		Menus.addSubMenuItem('topbar', 'view', 'Organizations', 'organizations', '/organizations');

		Menus.addMenuItem('topbar', 'Create', 'new', 'dropdown', '', 'menu.isPublic', ['user']);
    Menus.addSubMenuItem('topbar', 'new', 'Assay', 'assays/create', '/assays/create', 'menu.isPublic');
		Menus.addSubMenuItem('topbar', 'new', 'Device', 'devices/create', '/devices/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device Pool', 'device-pools/create', '/device-pools/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device Model', 'device-models/create', '/device-models/create');
		Menus.addSubMenuItem('topbar', 'new', 'Cartridge Labels', 'cartridges/labels', '/cartridges/labels');
		Menus.addSubMenuItem('topbar', 'new', 'Organization', 'organizations/create', '/organizations/create');

    Menus.addMenuItem('topbar', 'Manage Users', 'superusers', 'dropdown', '/superusers(/create)?', 'menu.isPublic', ['superuser']);
    Menus.addSubMenuItem('topbar', 'superusers', 'List Users', 'superusers');

		Menus.addMenuItem('topbar', 'Analyze Firmware ', 'firmware-tests', 'dropdown', '/firmware-tests(/create)?', 'menu.isPublic', ['superuser']);
		Menus.addSubMenuItem('topbar', 'firmware-tests', 'List Firmware tests', 'firmware-tests');
		Menus.addSubMenuItem('topbar', 'firmware-tests', 'New Firmware test', 'firmware-tests/create');
	}
]);
