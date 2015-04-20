'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	DeviceModel = mongoose.model('DeviceModel'),
	_ = require('lodash');

/**
 * Create a Device model
 */
exports.create = function(req, res) {
	var deviceModel = new DeviceModel(req.body);
	deviceModel.user = req.user;

	deviceModel.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(deviceModel);
		}
	});
};

/**
 * Show the current Device model
 */
exports.read = function(req, res) {
	res.jsonp(req.deviceModel);
};

/**
 * Update a Device model
 */
exports.update = function(req, res) {
	var deviceModel = req.deviceModel ;

	deviceModel = _.extend(deviceModel , req.body);

	deviceModel.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(deviceModel);
		}
	});
};

/**
 * Delete an Device model
 */
exports.delete = function(req, res) {
	var deviceModel = req.deviceModel ;

	deviceModel.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(deviceModel);
		}
	});
};

/**
 * List of Device models
 */
exports.list = function(req, res) { 
	DeviceModel.find().sort('-created').populate('user', 'displayName').exec(function(err, deviceModels) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(deviceModels);
		}
	});
};

/**
 * Device model middleware
 */
exports.deviceModelByID = function(req, res, next, id) { 
	DeviceModel.findById(id).populate('user', 'displayName').exec(function(err, deviceModel) {
		if (err) return next(err);
		if (! deviceModel) return next(new Error('Failed to load Device model ' + id));
		req.deviceModel = deviceModel ;
		next();
	});
};

/**
 * Device model authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.deviceModel.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
