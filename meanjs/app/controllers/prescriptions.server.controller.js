'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Prescription = mongoose.model('Prescription'),
	_ = require('lodash');

/**
 * Create a Prescription
 */
exports.create = function(req, res) {
	var prescription = new Prescription(req.body);
	prescription.user = req.user;

	prescription.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(prescription);
		}
	});
};

/**
 * Show the current Prescription
 */
exports.read = function(req, res) {
	var prescription = req.prescription;

	prescription.populate([{
    path: '_assays',
    select: '_id name'
  }], function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(prescription);
    }
  });
};

/**
 * Update a Prescription
 */
exports.update = function(req, res) {
	var prescription = req.prescription ;

	prescription = _.extend(prescription , req.body);

	prescription.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(prescription);
		}
	});
};

/**
 * Delete an Prescription
 */
exports.delete = function(req, res) {
	var prescription = req.prescription ;

	prescription.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(prescription);
		}
	});
};

/**
 * List of Prescriptions
 */

exports.list = function(req, res) {
	Prescription.find().sort('-created').populate([{
		path: '_assays',
		select: '_id name BCODE analysis'
	}, {
		path: 'user',
		select: 'displayName'
	}]).exec(function(err, prescriptions) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(prescriptions);
		}
	});
};

/**
 * Prescription middleware
 */
exports.prescriptionByID = function(req, res, next, id) {
	Prescription.findById(id).populate([{
		path: '_assays',
		select: '_id name'
	}, {
		path: 'user',
		select: 'displayName'
	}]).exec(function(err, prescription) {
		if (err) return next(err);
		if (! prescription) return next(new Error('Failed to load Prescription ' + id));
		req.prescription = prescription ;
		next();
	});
};

/**
 * Prescription authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.prescription.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
