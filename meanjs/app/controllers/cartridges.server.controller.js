'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Cartridge = mongoose.model('Cartridge'),
	Device = mongoose.model('Device'),
	Q = require('q'),
	_ = require('lodash');
	require('mongoose-pagination');

exports.get_inventory = function(req, res) {
	res.jsonp(req.count);
};

exports.get_unused = function(req, res) {
	var index = -1, pageNo;

	Cartridge.find({
		$and: [
			{_assay: req.body.assayID},
			{_test: {$exists: false}}
		]
	}).sort('-created').populate('user', 'displayName').exec(function(err, cartridges) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			console.log(req.body);
			if (req.body.cartridgeID.length) {
				console.log('CartridgeID', req.body.cartridgeID, cartridges);
				_.some(cartridges, function(e, i) {
					if (e._id.toHexString() === req.body.cartridgeID) {
						console.log('Cartridge found', e, i);
						index = i;
						return true;
					}
					else {
						return false;
					}
				});
				console.log('Cartridge index', index);
				if(index === -1) {
					res.jsonp({
						cartridges: [],
						currentPage: -1,
						activeCartridge: -1,
						number_of_items: 0
					});
				}
				else {
					pageNo = parseInt(index / req.body.pageSize) + 1;
					console.log('pageNo', pageNo);
					res.jsonp({
						cartridges: cartridges.slice((req.body.page - 1) * req.body.pageSize, req.body.page * req.body.pageSize),
						currentPage: req.body.page,
						activeCartridge: req.body.page === pageNo ? parseInt(index % req.body.pageSize) : -1,
						number_of_items: cartridges.length
					});
				}
			}
			else {
				console.log('No cartridge ID');
				res.jsonp({
					cartridges: cartridges.slice((req.body.page - 1) * req.body.pageSize, req.body.page * req.body.pageSize),
					currentPage: req.body.page,
					activeCartridge: -1,
					number_of_items: cartridges.length
				});
			}
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

exports.load = function(req, res) {
	Cartridge.find().paginate(req.body.page, req.body.pageSize).sort('-created').populate([{
		path: 'user',
	  select: 'displayName'
	}, {
	  path: '_assay',
	  select: 'name'
	}]).exec(function(err, cartridges, total) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			Cartridge.count().exec(function(err, count) {
				res.jsonp({
					cartridges: cartridges,
					number_of_items: count
				});
			});
		}
	});
};

exports.loadLabels = function(req, res) {
	Cartridge.find({registeredOn: {$exists:false}}).paginate(req.body.page, req.body.pageSize).sort('-created').populate([{
		path: 'user',
	  select: 'displayName'
	}, {
	  path: '_assay',
	  select: 'name'
	}]).exec(function(err, cartridges, total) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			Cartridge.count({registeredOn: {$exists:false}}).exec(function(err, count) {
				res.jsonp({
					cartridges: cartridges,
					number_of_items: count
				});
			});
		}
	});
};

/**
 * Cartridge middleware
 */
exports.cartridgeCountByAssayID = function(req, res, next, id) {
	Cartridge.count({
		$and: [
			{_assay: id},
			{_test: {$exists: false}}
		]
	}).exec(function(err, count) {
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
