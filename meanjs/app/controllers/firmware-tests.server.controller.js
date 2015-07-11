'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	FirmwareTest = mongoose.model('FirmwareTest'),
	_ = require('lodash');

/**
 * Create a Firmware test
 */
exports.create = function(req, res) {
	var firmwareTest = new FirmwareTest(req.body);
	firmwareTest.user = req.user;

	firmwareTest.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(firmwareTest);
		}
	});
};

/**
 * Show the current Firmware test
 */
exports.read = function(req, res) {
	res.jsonp(req.firmwareTest);
};

/**
 * Update a Firmware test
 */
exports.update = function(req, res) {
	var firmwareTest = req.firmwareTest ;

	firmwareTest = _.extend(firmwareTest , req.body);

	firmwareTest.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(firmwareTest);
		}
	});
};

/**
 * Delete an Firmware test
 */
exports.delete = function(req, res) {
	var firmwareTest = req.firmwareTest ;

	firmwareTest.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(firmwareTest);
		}
	});
};

/**
 * List of Firmware tests
 */
exports.list = function(req, res) { 
	FirmwareTest.find().sort('-created').populate('user', 'displayName').exec(function(err, firmwareTests) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(firmwareTests);
		}
	});
};

/**
 * Firmware test middleware
 */
exports.firmwareTestByID = function(req, res, next, id) { 
	FirmwareTest.findById(id).populate('user', 'displayName').exec(function(err, firmwareTest) {
		if (err) return next(err);
		if (! firmwareTest) return next(new Error('Failed to load Firmware test ' + id));
		req.firmwareTest = firmwareTest ;
		next();
	});
};

/**
 * Firmware test authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.firmwareTest.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
