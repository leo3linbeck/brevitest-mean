'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Spark = mongoose.model('Spark'),
	_ = require('lodash');

/**
 * Create a Spark
 */
exports.create = function(req, res) {
	var spark = new Spark(req.body);
	spark.user = req.user;

	spark.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spark);
		}
	});
};

/**
 * Show the current Spark
 */
exports.read = function(req, res) {
	res.jsonp(req.spark);
};

/**
 * Update a Spark
 */
exports.update = function(req, res) {
	var spark = req.spark ;

	spark = _.extend(spark , req.body);

	spark.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spark);
		}
	});
};

/**
 * Delete an Spark
 */
exports.delete = function(req, res) {
	var spark = req.spark ;

	spark.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spark);
		}
	});
};

/**
 * List of Sparks
 */
exports.list = function(req, res) { 
	Spark.find().sort('-created').populate('user', 'displayName').exec(function(err, sparks) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(sparks);
		}
	});
};

/**
 * Spark middleware
 */
exports.sparkByID = function(req, res, next, id) { 
	Spark.findById(id).populate('user', 'displayName').exec(function(err, spark) {
		if (err) return next(err);
		if (! spark) return next(new Error('Failed to load Spark ' + id));
		req.spark = spark ;
		next();
	});
};

/**
 * Spark authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.spark.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
