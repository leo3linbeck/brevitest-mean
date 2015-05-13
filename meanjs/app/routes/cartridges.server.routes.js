'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var cartridges = require('../../app/controllers/cartridges.server.controller');

	// Cartridges Routes
	app.route('/cartridges')
		.get(cartridges.list)
		.post(users.requiresLogin, cartridges.create);

	app.route('/cartridges/get_inventory/:assayId')
		.get(cartridges.get_inventory);

	app.route('/cartridges/:cartridgeId')
		.get(cartridges.read)
		.put(users.requiresLogin, cartridges.hasAuthorization, cartridges.update)
		.delete(users.requiresLogin, cartridges.hasAuthorization, cartridges.delete);

	// Finish by binding the Cartridge middleware
	app.param('assayId', cartridges.cartridgeCountByAssayID);
	app.param('cartridgeId', cartridges.cartridgeByID);
};
