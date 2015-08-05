'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var assays = require('../../app/controllers/assays.server.controller');

	// For all assay routes require minimum authority level of: user
    // Note: APPLIES TO ALL ROUTES BEGINNING WITH /assays
    app.use('/assays', users.hasAuthorization(['user']));

	// Assays Routes
	app.route('/assays')
		.get(assays.list)
		.post(assays.create);
		// .get(users.hasAuthorization(['admin', 'superuser']), assays.list)
		// .post(users.requiresLogin, users.hasAuthorization(['admin', 'superuser']), assays.create);

	app.route('/assays/make_10_cartridges')
		.post(assays.make_10_cartridges);

	app.route('/assays/load_unused_cartridges')
		.post(assays.load_unused_cartridges);

	app.route('/assays/:assayId')
		.get(assays.read)
		.put(assays.update)
		.delete(assays.delete);
		// .put(assays.hasAuthorization, assays.update)
		// .delete(assays.hasAuthorization, assays.delete);

	// Finish by binding the Assay middleware
	app.param('assayId', assays.assayByID);
};
