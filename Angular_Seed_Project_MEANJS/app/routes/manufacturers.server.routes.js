'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var manufacturers = require('../../app/controllers/manufacturers.server.controller');

	// Manufacturers Routes
	app.route('/manufacturers')
		.get(manufacturers.list)
		.post(users.requiresLogin, manufacturers.create);

	app.route('/manufacturers/:manufacturerId')
		.get(manufacturers.read)
		.put(users.requiresLogin, manufacturers.hasAuthorization, manufacturers.update)
		.delete(users.requiresLogin, manufacturers.hasAuthorization, manufacturers.delete);

	// Finish by binding the Manufacturer middleware
	app.param('manufacturerId', manufacturers.manufacturerByID);
};
