'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Organization = mongoose.model('Organization'),
	_ = require('lodash');

/**
 * Create a Organization
 */
exports.create = function(req, res) {
	var organization = new Organization(req.body);
	organization.user = req.user;

	organization.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(organization);
		}
	});
};

/**
 * Show the current Organization
 */
exports.read = function(req, res) {
	res.jsonp(req.organization);
};

/**
 * Update a Organization
 */
exports.update = function(req, res) {
	var organization = req.organization ;

	organization = _.extend(organization , req.body);

	organization.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(organization);
		}
	});
};

/**
 * Delete an Organization
 */
exports.delete = function(req, res) {
	var organization = req.organization ;

	organization.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(organization);
		}
	});
};

/**
 * List of Organizations
 */
exports.list = function(req, res) { 
	Organization.find().sort('-created').populate('user', 'displayName').exec(function(err, organizations) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(organizations);
		}
	});
};

/**
 * Organization middleware
 */
exports.organizationByID = function(req, res, next, id) { 
	Organization.findById(id).populate('user', 'displayName').exec(function(err, organization) {
		if (err) return next(err);
		if (! organization) return next(new Error('Failed to load Organization ' + id));
		req.organization = organization ;
		next();
	});
};

/**
 * Organization authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.organization.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
