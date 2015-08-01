'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var tests = require('../../app/controllers/tests.server.controller');

	// Tests Routes
	app.route('/tests')
		.get(tests.list)
		.post(users.requiresLogin, tests.create);

	app.route('/tests/load')
	  .all(tests.load);

	app.route('/tests/cancel')
	  .all(tests.cancel);

	app.route('/tests/recently_started')
	  .all(tests.recently_started);

	app.route('/tests/begin')
		.post(tests.begin);

	app.route('/tests/exportable')
		.get(tests.exportable);

	app.route('/tests/run')
		.all(tests.run);

	app.route('/tests/:testId')
		.get(tests.read)
		.put(users.requiresLogin, tests.hasAuthorization, tests.update)
		.delete(users.requiresLogin, tests.hasAuthorization, tests.delete);

	// Finish by binding the Test middleware
	app.param('testId', tests.testByID);
};
