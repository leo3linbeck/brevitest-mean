'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var sparks = require('../../app/controllers/sparks.server.controller');

	// Sparks Routes
	app.route('/sparks')
		.get(sparks.list)
		.post(users.requiresLogin, sparks.create);

	app.route('/sparks/:sparkId')
		.get(sparks.read)
		.put(users.requiresLogin, sparks.hasAuthorization, sparks.update)
		.delete(users.requiresLogin, sparks.hasAuthorization, sparks.delete);

	// Finish by binding the Spark middleware
	app.param('sparkId', sparks.sparkByID);
};
