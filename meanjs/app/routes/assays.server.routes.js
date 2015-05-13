'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var assays = require('../../app/controllers/assays.server.controller');

	// Assays Routes
	app.route('/assays')
		.get(assays.list)
		.post(users.requiresLogin, assays.create);

	app.route('/assays/make10cartridges')
		.post(assays.make10cartridges);

	app.route('/assays/:assayId')
	.get(assays.read)
	.put(users.requiresLogin, assays.hasAuthorization, assays.update)
	.delete(users.requiresLogin, assays.hasAuthorization, assays.delete);

	// Finish by binding the Assay middleware
	app.param('assayId', assays.assayByID);
};
