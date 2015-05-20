'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var tests = require('../../app/controllers/tests.server.controller');

	// Tests Routes
	app.route('/tests')
		.get(tests.list)
		.post(users.requiresLogin, tests.create);

	app.route('/tests/underway')
	  .all(tests.underway);

	app.route('/tests/review')
	  .all(tests.review);

	app.route('/tests/begin')
		.post(tests.begin);

	app.route('/tests/monitor')
	  .all(tests.monitor);

	app.route('/tests/update_one_test')
	  .all(tests.update_one_test);

	app.route('/tests/status')
	  .all(tests.status);

	app.route('/tests/run')
		.all(tests.run);

	app.route('/tests/:testId')
		.get(tests.read)
		.put(users.requiresLogin, tests.hasAuthorization, tests.update)
		.delete(users.requiresLogin, tests.hasAuthorization, tests.delete);

	// Finish by binding the Test middleware
	app.param('testId', tests.testByID);
};
