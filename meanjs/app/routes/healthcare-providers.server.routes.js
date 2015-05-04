'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var healthcareProviders = require('../../app/controllers/healthcare-providers.server.controller');

	// Healthcare providers Routes
	app.route('/healthcare-providers')
		.get(healthcareProviders.list)
		.post(users.requiresLogin, healthcareProviders.create);

	app.route('/healthcare-providers/:healthcareProviderId')
		.get(healthcareProviders.read)
		.put(users.requiresLogin, healthcareProviders.hasAuthorization, healthcareProviders.update)
		.delete(users.requiresLogin, healthcareProviders.hasAuthorization, healthcareProviders.delete);

	// Finish by binding the Healthcare provider middleware
	app.param('healthcareProviderId', healthcareProviders.healthcareProviderByID);
};
