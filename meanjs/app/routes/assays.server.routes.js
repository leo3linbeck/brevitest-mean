'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var assays = require('../../app/controllers/assays.server.controller');

    app.use('/assays', users.hasAuthorization(['user']));

	// Assays Routes
	app.route('/assays')
		.get(users.hasAuthorization(['admin', 'superuser']), assays.list)
		.post(users.requiresLogin, users.hasAuthorization(['admin', 'superuser']), assays.create);

	app.route('/assays/make10cartridges')
		.post(assays.make10cartridges);

	app.route('/assays/:assayId')
		.get(assays.read)
		.put(assays.hasAuthorization, assays.update)
		.delete(assays.hasAuthorization, assays.delete);

	// Finish by binding the Assay middleware
	app.param('assayId', assays.assayByID);
};
