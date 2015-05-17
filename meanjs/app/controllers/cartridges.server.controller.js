'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Cartridge = mongoose.model('Cartridge'),
	_ = require('lodash');

exports.get_inventory = function(req, res) {
	res.jsonp(req.count);
};

exports.get_unused = function(req, res) {
	Cartridge.find({
		$and: [
			{_assay: req.body.assayID},
			{_test: {$exists: false}}
		]
	}).sort('-created').exec(function(err, cartridges) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(cartridges);
		}
	});
};

/**
 * Create a Cartridge
 */
exports.create = function(req, res) {
	var cartridge = new Cartridge(req.body);
	cartridge.user = req.user;

	cartridge.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(cartridge);
		}
	});
};

/**
 * Show the current Cartridge
 */
exports.read = function(req, res) {
	res.jsonp(req.cartridge);
};

/**
 * Update a Cartridge
 */
exports.update = function(req, res) {
	var cartridge = req.cartridge ;

	cartridge = _.extend(cartridge , req.body);

	cartridge.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(cartridge);
		}
	});
};

/**
 * Delete an Cartridge
 */
exports.delete = function(req, res) {
	var cartridge = req.cartridge ;

	cartridge.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(cartridge);
		}
	});
};

/**
 * List of Cartridges
 */
exports.list = function(req, res) {
	Cartridge.find().sort('-created').populate('user', 'displayName').exec(function(err, cartridges) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(cartridges);
		}
	});
};

/**
 * Cartridge middleware
 */
exports.cartridgeCountByAssayID = function(req, res, next, id) {
	Cartridge.count({_assay: id}).exec(function(err, count) {
		if (err) return next(err);
		req.count = count ;
		next();
	});
};

exports.cartridgeByID = function(req, res, next, id) {
	Cartridge.findById(id).populate('user', 'displayName').exec(function(err, cartridge) {
		if (err) return next(err);
		if (! cartridge) return next(new Error('Failed to load Cartridge ' + id));
		req.cartridge = cartridge ;
		next();
	});
};

/**
 * Cartridge authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.cartridge.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
