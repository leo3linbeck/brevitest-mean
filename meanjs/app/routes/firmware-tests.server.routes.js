'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var firmwareTests = require('../../app/controllers/firmware-tests.server.controller');

	// Firmware tests Routes
	app.route('/firmware-tests')
		.get(firmwareTests.list)
		.post(users.requiresLogin, firmwareTests.create);

	app.route('/firmware-tests/:firmwareTestId')
		.get(firmwareTests.read)
		.put(users.requiresLogin, firmwareTests.hasAuthorization, firmwareTests.update)
		.delete(users.requiresLogin, firmwareTests.hasAuthorization, firmwareTests.delete);

	// Finish by binding the Firmware test middleware
	app.param('firmwareTestId', firmwareTests.firmwareTestByID);
};
