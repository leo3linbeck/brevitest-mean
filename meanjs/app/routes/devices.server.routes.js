'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var devices = require('../../app/controllers/devices.server.controller');

	// Devices Routes
	app.route('/devices')
		.get(devices.list)
		.post(users.requiresLogin, devices.create);

	app.route('/devices/available')
		.get(devices.available);

	app.route('/devices/initialize')
		.post(devices.initialize);

	app.route('/devices/move_to_and_set_calibration_point')
		.post(devices.move_to_and_set_calibration_point);

	app.route('/devices/:deviceId')
		.get(devices.read)
		.put(users.requiresLogin, devices.hasAuthorization, devices.update)
		.delete(users.requiresLogin, devices.hasAuthorization, devices.delete);

	// Finish by binding the Device middleware
	app.param('deviceId', devices.deviceByID);
};
