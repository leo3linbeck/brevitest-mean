'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var superusers = require('../../app/controllers/superusers.server.controller');

	// Superusers Routes

    app.route('/users/:userId')
        .get(superusers.superuserByID)
        .put(superusers.update)
        .delete(superusers.delete);

    app.param('userId', users.userByID);
};
