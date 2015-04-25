'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Provider = mongoose.model('Provider'),
	_ = require('lodash');

/**
 * Create a Provider
 */
exports.create = function(req, res) {
	var provider = new Provider(req.body);
	provider.user = req.user;

	provider.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(provider);
		}
	});
};

/**
 * Show the current Provider
 */
exports.read = function(req, res) {
	res.jsonp(req.provider);
};

/**
 * Update a Provider
 */
exports.update = function(req, res) {
	var provider = req.provider ;

	provider = _.extend(provider , req.body);

	provider.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(provider);
		}
	});
};

/**
 * Delete an Provider
 */
exports.delete = function(req, res) {
	var provider = req.provider ;

	provider.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(provider);
		}
	});
};

/**
 * List of Providers
 */
exports.list = function(req, res) { 
	Provider.find().sort('-created').populate('user', 'displayName').exec(function(err, providers) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(providers);
		}
	});
};

/**
 * Provider middleware
 */
exports.providerByID = function(req, res, next, id) { 
	Provider.findById(id).populate('user', 'displayName').exec(function(err, provider) {
		if (err) return next(err);
		if (! provider) return next(new Error('Failed to load Provider ' + id));
		req.provider = provider ;
		next();
	});
};

/**
 * Provider authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.provider.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
