'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Test = mongoose.model('Test'),
  Assay = mongoose.model('Assay'),
  Device = mongoose.model('Device'),
  Cartridge = mongoose.model('Cartridge'),
  sparkcore = require('spark'),
  Q = require('q'),
  _ = require('lodash');

exports.run = function(req, res) {
  var test = new Test();
  test.user = req.user;
  test._assay = req.body.assay._id;
  test._device = req.body.device._id;
  test._cartridge = req.body.cartridge._id;
  test.name = req.body.name ? req.body.name : ('Assay ' + req.body.assay._id + ' on device ' + req.body.device._id + 'using cartridge ' + req.body.cartridge._id);
  test.description = req.body.description;
  test.status = 'Starting';
  test.percentComplete = 0;

  test.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(test);
    }
  });
};

exports.begin = function(req, res) {
  var test = new Test();
  test.user = req.user;
  test._assay = req.body.assayId;
  test._device = req.body.deviceId;
  test._cartridge = req.body.cartridgeId;
  test.name = req.body.name ? req.body.name : ('Assay ' + req.body.assayId + ' on device ' + req.body.deviceId + 'using cartridge ' + req.body.cartridgeId);
  test.description = req.body.description;
  test.status = 'Starting';
  test.percentComplete = 0;

  Q.fcall(function(t) {
    return t.save();
  }, test)
  .then(function(test) {
    
  })
  .fail(function(err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  })
  .done();

  // add spark call here

  res.jsonp({msg: 'Test begun'});
};

/**
 * Create a Test
 */
exports.create = function(req, res) {
  var test = new Test(req.body);
  test.user = req.user;

  test.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(test);
    }
  });
};

/**
 * Show the current Test
 */
exports.read = function(req, res) {
  var test = req.test;

  test.populate([{
    path: '_assay',
    select: '_id name'
  }, {
    path: '_device',
    select: '_id name'
  }, {
		path: '_cartridge',
    select: '_id name result failed BCODE startedOn finishedOn'
	}], function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(test);
    }
  });
};

/**
 * Update a Test
 */
exports.update = function(req, res) {
  var test = req.test;

  test = _.extend(test, req.body);

  test.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(test);
    }
  });
};

/**
 * Delete an Test
 */
exports.delete = function(req, res) {
  var test = req.test;

  test.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(test);
    }
  });
};

/**
 * List of Tests
 */
exports.list = function(req, res) {
  Test.find().sort('-created').populate('user', 'displayName').exec(function(err, tests) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(tests);
    }
  });
};

/**
 * Test middleware
 */
exports.testByID = function(req, res, next, id) {
  Test.findById(id).populate([{
    path: 'user',
    select: 'displayName'
  }, {
    path: '_assay',
    select: '_id name'
  }, {
    path: '_device',
    select: '_id name'
  }, {
    path: '_cartridge',
    select: '_id name result failed BCODE startedOn finishedOn'
  }]).exec(function(err, test) {
    if (err) return next(err);
    if (!test) return next(new Error('Failed to load Test ' + id));
    req.test = test;
    next();
  });
};

/**
 * Test authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
  if (req.test.user.id !== req.user.id) {
    return res.status(403).send('User is not authorized');
  }
  next();
};
