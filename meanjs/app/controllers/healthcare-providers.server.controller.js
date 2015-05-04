'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	HealthcareProvider = mongoose.model('HealthcareProvider'),
	_ = require('lodash');

/**
 * Create a Healthcare provider
 */
exports.create = function(req, res) {
	var healthcareProvider = new HealthcareProvider(req.body);
	healthcareProvider.user = req.user;

	healthcareProvider.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(healthcareProvider);
		}
	});
};

/**
 * Show the current Healthcare provider
 */
exports.read = function(req, res) {
	res.jsonp(req.healthcareProvider);
};

/**
 * Update a Healthcare provider
 */
exports.update = function(req, res) {
	var healthcareProvider = req.healthcareProvider ;

	healthcareProvider = _.extend(healthcareProvider , req.body);

	healthcareProvider.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(healthcareProvider);
		}
	});
};

/**
 * Delete an Healthcare provider
 */
exports.delete = function(req, res) {
	var healthcareProvider = req.healthcareProvider ;

	healthcareProvider.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(healthcareProvider);
		}
	});
};

/**
 * List of Healthcare providers
 */
exports.list = function(req, res) { 
	HealthcareProvider.find().sort('-created').populate('user', 'displayName').exec(function(err, healthcareProviders) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(healthcareProviders);
		}
	});
};

/**
 * Healthcare provider middleware
 */
exports.healthcareProviderByID = function(req, res, next, id) { 
	HealthcareProvider.findById(id).populate('user', 'displayName').exec(function(err, healthcareProvider) {
		if (err) return next(err);
		if (! healthcareProvider) return next(new Error('Failed to load Healthcare provider ' + id));
		req.healthcareProvider = healthcareProvider ;
		next();
	});
};

/**
 * Healthcare provider authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.healthcareProvider.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
