'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Manufacturer = mongoose.model('Manufacturer'),
	_ = require('lodash');

/**
 * Create a Manufacturer
 */
exports.create = function(req, res) {
	var manufacturer = new Manufacturer(req.body);
	manufacturer.user = req.user;

	manufacturer.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(manufacturer);
		}
	});
};

/**
 * Show the current Manufacturer
 */
exports.read = function(req, res) {
	res.jsonp(req.manufacturer);
};

/**
 * Update a Manufacturer
 */
exports.update = function(req, res) {
	var manufacturer = req.manufacturer ;

	manufacturer = _.extend(manufacturer , req.body);

	manufacturer.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(manufacturer);
		}
	});
};

/**
 * Delete an Manufacturer
 */
exports.delete = function(req, res) {
	var manufacturer = req.manufacturer ;

	manufacturer.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(manufacturer);
		}
	});
};

/**
 * List of Manufacturers
 */
exports.list = function(req, res) { 
	Manufacturer.find().sort('-created').populate('user', 'displayName').exec(function(err, manufacturers) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(manufacturers);
		}
	});
};

/**
 * Manufacturer middleware
 */
exports.manufacturerByID = function(req, res, next, id) { 
	Manufacturer.findById(id).populate('user', 'displayName').exec(function(err, manufacturer) {
		if (err) return next(err);
		if (! manufacturer) return next(new Error('Failed to load Manufacturer ' + id));
		req.manufacturer = manufacturer ;
		next();
	});
};

/**
 * Manufacturer authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.manufacturer.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
