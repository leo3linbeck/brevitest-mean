'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Superuser = mongoose.model('Superuser'),
	_ = require('lodash');

/**
 * Create a Superuser
 */
exports.create = function(req, res) {
	var superuser = new Superuser(req.body);
	superuser.user = req.user;

	superuser.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superuser);
		}
	});
};

/**
 * Show the current Superuser
 */
exports.read = function(req, res) {
	res.jsonp(req.superuser);
};

/**
 * Update a Superuser
 */
exports.update = function(req, res) {
	var superuser = req.superuser ;

	superuser = _.extend(superuser , req.body);

	superuser.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superuser);
		}
	});
};

/**
 * Delete an Superuser
 */
exports.delete = function(req, res) {
	var superuser = req.superuser ;

	superuser.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superuser);
		}
	});
};

/**
 * List of Superusers
 */
exports.list = function(req, res) { 
	Superuser.find().sort('-created').populate('user', 'displayName').exec(function(err, superusers) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(superusers);
		}
	});
};

/**
 * Superuser middleware
 */
exports.superuserByID = function(req, res, next, id) { 
	Superuser.findById(id).populate('user', 'displayName').exec(function(err, superuser) {
		if (err) return next(err);
		if (! superuser) return next(new Error('Failed to load Superuser ' + id));
		req.superuser = superuser ;
		next();
	});
};

/**
 * Superuser authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.superuser.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
