'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var devices = require('../../app/controllers/devices.server.controller');

    app.use('/devices', users.hasAuthorization(['user']));

	// Devices Routes
	app.route('/devices/attach_particle')
		.post(devices.attach_particle);

	app.route('/devices/detach_particle')
		.post(devices.detach_particle);

	app.route('/devices/pool')
		.post(devices.pool);

	app.route('/devices/refresh_pool')
		.get(devices.refresh_pool);

	app.route('/devices/refresh')
		.get(devices.refresh);

	app.route('/devices/available')
		.get(devices.available);

	app.route('/devices/flash_firmware')
		.post(devices.flash_firmware);

	app.route('/devices/claim')
		.post(devices.claim);

	app.route('/devices/release')
		.post(devices.release);

	app.route('/devices/load_by_model')
		.post(devices.load_by_model);

	app.route('/devices/move_to_and_set_calibration_point')
		.post(devices.move_to_and_set_calibration_point);

	app.route('/devices')
		.get(devices.list)
		.post(users.requiresLogin, devices.create);

	app.route('/devices/:deviceId')
		.get(devices.read)
		.put(users.requiresLogin, devices.hasAuthorization, devices.update)
		.delete(users.requiresLogin, devices.hasAuthorization, devices.delete);

	// Finish by binding the Device middleware
	app.param('deviceId', devices.deviceByID);
};
