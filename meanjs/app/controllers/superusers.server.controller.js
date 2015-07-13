'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Superuser = mongoose.model('Superuser'),
	User = mongoose.model('User'),
	_ = require('lodash');

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
exports.update = function(req, res) {

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
exports.delete = function(req, res) {
	var superuser = req.profile;

	/**
	 * req.profile - user being deleted
	 * req.user - user making request to delete (superuser)
	 */

	if (!req.user._id.equals(req.profile._id)) { // requires .equals function because mongoose uses custom datatypes. http://stackoverflow.com/questions/11637353/comparing-mongoose-id-and-strings
		superuser.remove(function(err) {
			if (err) {
				return res.status(403).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.jsonp(superuser);
			}
		});
	} else {
		res.jsonp({superuser: req.profile, error: 'Cannot delete yourself.'});
	}
};
