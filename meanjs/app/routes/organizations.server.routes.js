'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var organizations = require('../../app/controllers/organizations.server.controller');

	// Organizations Routes
	app.route('/organizations')
		.get(organizations.list)
		.post(users.requiresLogin, organizations.create);

	app.route('/organizations/:organizationId')
		.get(organizations.read)
		.put(users.requiresLogin, organizations.hasAuthorization, organizations.update)
		.delete(users.requiresLogin, organizations.hasAuthorization, organizations.delete);

	// Finish by binding the Organization middleware
	app.param('organizationId', organizations.organizationByID);
};
