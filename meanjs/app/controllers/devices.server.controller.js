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

  var brevitestParticle = require('../../app/modules/brevitest-particle');
  var brevitestCommand = require('../../app/modules/brevitest-command');
  var brevitestRequest = require('../../app/modules/brevitest-request');

exports.move_to_and_set_calibration_point = function(req, res) {
  brevitestParticle.get_particle_from_device(req.user, req.body.device)
    .then(function(particle) {
      return new Q(brevitestCommand.set_calibration_point(req.body.device.calibrationSteps));
    })
    .then(function(result) {
      if (result.return_value !== 1) {
        throw new Error('Calibration failed, error code ' + result.return_value);
      }
      res.jsonp({
        result: req.body.device.name + ' moved to calibration point'
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        message: error.message
      });
    })
    .done();
};

exports.claim = function(req, res) {
  brevitestParticle.get_particle_from_device(req.user, req.body.device)
    .then(function(particle) {
      return new Q(brevitestCommand.claim_device(req.user, req.body.assay));
    })
    .then(function(result) {
      if (result.return_value === -1) {
          return new Q(brevitestCommand.start_send_assay(req.body.assay));
      }
      else {
          return result;
      }
    .then(function(result) {
      res.jsonp({
        result: req.body.device.name + ' moved to calibration point'
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        message: error.message
      });
    })
    .done();
};

exports.load_by_model = function(req, res) {
  Device.find({_deviceModel: req.body.deviceModelID}).sort('-created').populate([{
    path: 'user',
    select: 'displayName'
  }]).exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

exports.available = function(req, res) {
  Q.fcall(function() {
      return Cartridge.find({
        $and: [{
          startedOn: {$exists: true}
        }, {
          finishedOn: {$exists: false}
        }]
      }).exec();
    })
    .then(function(activeCartridges) {
      var activeDevices = _.pluck(activeCartridges, '_device');
      return new Q(Device.find({
        _id: {$nin: activeDevices}
      }).sort('name').populate([{
        path: '_deviceModel',
        select: '_id name'
      }]).exec());
    })
    .then(function(availableDevices) {
      res.jsonp(_.filter(availableDevices, function(e) {return e._spark.connected;}));
    })
    .fail(function(err) {
      console.log('Error searching for active devices', err);
    })
    .done();
};

/**
 * Create a Device
 */
exports.create = function(req, res) {
  var device = new Device(req.body);
  device.user = req.user;

  device.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Show the current Device
 */
exports.read = function(req, res) {
  var device = req.device;

  device.populate([{
    path: '_deviceModel',
    select: '_id name'
  }, {
    path: '_spark',
    select: '_id name sparkID connected'
  }], function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Update a Device
 */
exports.update = function(req, res) {
  var device = req.device;

  device = _.extend(device, req.body);

  device.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Delete an Device
 */
exports.delete = function(req, res) {
  var device = req.device;

  device.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * List of Devices
 */
exports.list = function(req, res) {
  Device.find().sort('-created').populate([{
    path: 'user',
    select: 'displayName'
  }, {
    path: '_spark',
    select: '_id name sparkID connected'
  }]).exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

/**
 * Device middleware
 */
exports.deviceByID = function(req, res, next, id) {
  Device.findById(id).populate([{
    path: 'user',
    select: 'displayName'
  }, {
    path: '_spark',
    select: '_id name sparkID'
  }, {
    path: '_deviceModel',
    select: '_id name'
  }]).exec(function(err, device) {
    if (err) return next(err);
    if (!device) return next(new Error('Failed to load Device ' + id));
    req.device = device;
    next();
  });
};

/**
 * Device authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
  if (req.device.user.id !== req.user.id) {
    return res.status(403).send('User is not authorized');
  }
  next();
};
