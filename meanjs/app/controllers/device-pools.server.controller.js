'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	DevicePool = mongoose.model('DevicePool'),
	_ = require('lodash');

var populateArray = [{
  path: 'user',
  select: 'displayName'
}, {
  path: '_organization',
  select: '_id name'
}];

exports.select = function(req, res) {
	res.jsonp(req.devicePool);
};

/**
 * Create a Device pool
 */
exports.create = function(req, res) {
	var devicePool = new DevicePool(req.body);
	devicePool.user = req.user;

	devicePool.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(devicePool);
		}
	});
};

/**
 * Show the current Device pool
 */
exports.read = function(req, res) {
	res.jsonp(req.devicePool);
};

/**
 * Update a Device pool
 */
exports.update = function(req, res) {
	var devicePool = req.devicePool ;

	devicePool = _.extend(devicePool , req.body);

	devicePool.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(devicePool);
		}
	});
};

/**
 * Delete an Device pool
 */
exports.delete = function(req, res) {
	var devicePool = req.devicePool ;

	devicePool.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(devicePool);
		}
	});
};

/**
 * List of Device pools
 */
exports.list = function(req, res) {
	DevicePool.find().sort('-created').populate(populateArray).exec(function(err, devicePools) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(devicePools);
		}
	});
};

/**
 * Device pool middleware
 */
exports.devicePoolByID = function(req, res, next, id) {
	DevicePool.findById(id).populate(populateArray).exec(function(err, devicePool) {
		if (err) return next(err);
		if (! devicePool) return next(new Error('Failed to load Device pool ' + id));
		req.devicePool = devicePool ;
		next();
	});
};

/**
 * Device pool authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.devicePool.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
