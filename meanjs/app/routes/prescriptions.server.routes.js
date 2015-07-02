'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var prescriptions = require('../../app/controllers/prescriptions.server.controller');

	app.use('/prescriptions', users.hasAuthorization(['user']));

	// Prescriptions Routes
	app.route('/prescriptions')
		.get(prescriptions.list)
		.post(users.requiresLogin, prescriptions.create);

	app.route('/prescriptions/unfilled')
		.get(prescriptions.unfilled);

	app.route('/prescriptions/create')
		.all(prescriptions.create);

	app.route('/prescriptions/:prescriptionId')
		.get(prescriptions.read)
		.put(users.requiresLogin, prescriptions.hasAuthorization, prescriptions.update)
		.delete(users.requiresLogin, prescriptions.hasAuthorization, prescriptions.delete);

	// Finish by binding the Prescription middleware
	app.param('prescriptionId', prescriptions.prescriptionByID);
};
