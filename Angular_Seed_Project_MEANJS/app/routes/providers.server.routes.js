'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var providers = require('../../app/controllers/providers.server.controller');

	// Providers Routes
	app.route('/providers')
		.get(providers.list)
		.post(users.requiresLogin, providers.create);

	app.route('/providers/:providerId')
		.get(providers.read)
		.put(users.requiresLogin, providers.hasAuthorization, providers.update)
		.delete(users.requiresLogin, providers.hasAuthorization, providers.delete);

	// Finish by binding the Provider middleware
	app.param('providerId', providers.providerByID);
};
