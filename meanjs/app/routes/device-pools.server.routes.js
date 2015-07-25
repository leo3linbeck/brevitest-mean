'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var devicePools = require('../../app/controllers/device-pools.server.controller');

	// Device pools Routes
	app.route('/device-pools')
		.get(devicePools.list)
		.post(users.requiresLogin, devicePools.create);

	app.route('/device-pools/select')
		.post(users.requiresLogin, devicePools.select);

	app.route('/device-pools/:devicePoolId')
		.get(devicePools.read)
		.put(users.requiresLogin, devicePools.hasAuthorization, devicePools.update)
		.delete(users.requiresLogin, devicePools.hasAuthorization, devicePools.delete);

	// Finish by binding the Device pool middleware
	app.param('devicePoolId', devicePools.devicePoolByID);
};
