'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var deviceModels = require('../../app/controllers/device-models.server.controller');

	app.use('/device-models', users.hasAuthorization(['user']));

	// Device models Routes
	app.route('/device-models')
		.get(deviceModels.list)
		.post(users.requiresLogin, deviceModels.create);

	app.route('/device-models/:deviceModelId')
		.get(deviceModels.read)
		.put(users.requiresLogin, deviceModels.hasAuthorization, deviceModels.update)
		.delete(users.requiresLogin, deviceModels.hasAuthorization, deviceModels.delete);

	// Finish by binding the Device model middleware
	app.param('deviceModelId', deviceModels.deviceModelByID);
};
