'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var superusers = require('../../app/controllers/superusers.server.controller');

	// Superusers Routes
	app.route('/superusers')
		.get(superusers.list)
		.post(users.requiresLogin, superusers.create);

	app.route('/superusers/:superuserId')
		.get(superusers.read)
		.put(users.requiresLogin, superusers.hasAuthorization, superusers.update)
		.delete(users.requiresLogin, superusers.hasAuthorization, superusers.delete);

	// Finish by binding the Superuser middleware
	app.param('superuserId', superusers.superuserByID);
};
