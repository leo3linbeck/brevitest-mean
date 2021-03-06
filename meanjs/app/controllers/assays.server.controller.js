'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Assay = mongoose.model('Assay'),
	Cartridge = mongoose.model('Cartridge'),
	Q = require('q'),
	_ = require('lodash');

exports.load_unused_cartridges = function(req, res) {
	new Q(Cartridge.find({ _assay: req.body.assayID, _test: {$exists: false} }).sort('expirationDate').exec())
		.then(function(cartridges) {
			res.jsonp(cartridges);
		})
		.fail(function(err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		})
		.done();
};

exports.make_10_cartridges = function(req, res) {
	var i, promises = [];
	var assay = req.body.assay;

	for (i = 0; i < 10; i += 1) {
		var now = new Date();
		var exp = new Date();
		exp.setDate(exp.getDate() + assay.usableLife);
		var cartridge = new Cartridge ({
			name: assay.name + Math.random(),
			_assay: assay._id,
			manufacturedOn: now,
			expirationDate: exp,
			user: req.user
		});
		promises.push(new Q(cartridge.save()));
	}

	Q.allSettled(promises)
		.then(function() {
			return new Q(Cartridge.count({ _assay: assay._id, _test: {$exists: false} }).exec());
		})
		.then(function(count) {
			res.jsonp(count);
		})
		.fail(function(err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		})
		.done();
};

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
	var assay = req.assay;

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
	Assay.find().sort('name').populate('user', 'displayName').exec(function(err, assays) {
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
    // if (_.contains(req.user.roles, 'superuser', 0))
    //     return next();
    // else if (req.assay.user.id !== req.user.id) {
    //     var res_err = 'To delete an assay you need to be the creator or a superuser. Assay created by ' + req.assay.user.id + '.';
    //     return res.jsonp({error: res_err});
		//
    // }
    // next();
	if (!req.device.user.id) {
    return res.status(403).send('You must be signed in access assays');
  }
  next();
};
