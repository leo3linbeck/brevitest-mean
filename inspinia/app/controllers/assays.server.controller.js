'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Assay = mongoose.model('Assay'),
	_ = require('lodash');

/**
 * Create a Assay
 */
exports.create = function(req, res) {
	var assay = new Assay(req.body);
	assay.user = req.user;

	assay.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(assay);
		}
	});
};

/**
 * Show the current Assay
 */
exports.read = function(req, res) {
	res.jsonp(req.assay);
};

/**
 * Update a Assay
 */
exports.update = function(req, res) {
	var assay = req.assay ;

	assay = _.extend(assay , req.body);

	assay.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(assay);
		}
	});
};

/**
 * Delete an Assay
 */
exports.delete = function(req, res) {
	var assay = req.assay ;

	assay.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(assay);
		}
	});
};

/**
 * List of Assays
 */
exports.list = function(req, res) {
	Assay.find().sort('-created').populate('user', 'displayName').exec(function(err, assays) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(assays);
		}
	});
};

/**
 * Assay middleware
 */
exports.assayByID = function(req, res, next, id) {
	Assay.findById(id).populate('user', 'displayName').exec(function(err, assay) {
		if (err) return next(err);
		if (! assay) return next(new Error('Failed to load Assay ' + id));
		req.assay = assay ;
		next();
	});
};

/**
 * Assay authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.assay.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
