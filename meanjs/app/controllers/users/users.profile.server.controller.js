'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors.server.controller.js'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User');



/**
 * List of Users
 */
exports.list = function (req, res) {
    User.find().sort('-created').populate('user', 'displayName').exec(function (err, users) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(users);
        }
    });
};

/**
 * Superuser middleware
 */
exports.superuserByID = function(req, res, next) {
    User.findById(req.params.userId).populate('user', 'displayName').exec(function(err, user) {
        if (err) return next(err);
        if (! user) return next(new Error('Failed to load Superuser ' + req.params.userId));
        res.jsonp(user);
    });
};

/**
 * Update a Superuser
 */
exports.superuserUpdate = function(req, res) {

    var superuser = req.profile;

    superuser = _.extend(superuser, req.body);
    var _password = superuser.password;
    var __id = superuser._id;

    superuser.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {

            res.jsonp(superuser);
            console.log(superuser.password);
        }
    });
    User.findOne({ _id: __id }, function (err, doc) {
        doc.password = _password;
        doc.save();
    });
};

/**
 * Delete an Superuser
 */
exports.superuserDelete = function(req, res) {
    var superuser = req.profile;

    superuser.remove(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp('hello');
            //res.redirect('/superusers');
        }
    });
};

/**
 * Update user details
 */
exports.update = function(req, res) {
	// Init Variables
	var user = req.user;
	var message = null;

	// For security measurement we remove the roles from the req.body object
	delete req.body.roles;

	if (user) {
		// Merge existing user
		user = _.extend(user, req.body);
		user.updated = Date.now();
		user.displayName = user.firstName + ' ' + user.lastName;

		user.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.json(user);
					}
				});
			}
		});
	} else {
		res.status(400).send({
			message: 'User is not signed in'
		});
	}
};

/**
 * Send User
 */
exports.me = function(req, res) {
	res.json(req.user || null);
};
