'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var sparks = require('../../app/controllers/sparks.server.controller');

	// Sparks Routes
	app.route('/sparks')
		.get(sparks.list)
		.post(users.requiresLogin, sparks.create);

	app.route('/sparks/refresh')
		.get(sparks.refresh);

	app.route('/sparks/reflash')
		.post(sparks.reflash);

	app.route('/sparks/archive_size')
		.post(sparks.get_archive_size);

	app.route('/sparks/record_by_index')
		.post(sparks.get_record_by_index);

	app.route('/sparks/record_by_cartridge_id')
		.post(sparks.get_record_by_cartridge_id);

	app.route('/sparks/erase_archived_data')
		.post(sparks.erase_archived_data);

	app.route('/sparks/:sparkId')
		.get(sparks.read)
		.put(users.requiresLogin, sparks.hasAuthorization, sparks.update)
		.delete(users.requiresLogin, sparks.hasAuthorization, sparks.delete);

	// Finish by binding the Spark middleware
	app.param('sparkId', sparks.sparkByID);
};
