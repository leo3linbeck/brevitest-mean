'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Device = mongoose.model('Device'),
  Cartridge = mongoose.model('Cartridge'),
  Assay = mongoose.model('Assay'),
  Q = require('q'),
  _ = require('lodash');

var particle = require('../../app/modules/brevitest-particle');
var devicePopulate = [{
  path: 'user',
  select: 'displayName'
}, {
  path: '_devicePool',
  select: '_id name'
}, {
  path: '_deviceModel',
  select: '_id name'
}];

exports.attach_particle = function(req, res) {
  particle.get_particle_device_from_uuid(req.user, req.body.deviceID)
    .spread(function(device, particle_device) {
      device.particleName = particle_device.name;
      device.lastHeard = particle_device.lastHeard;
      device.lastIpAddress = particle_device.lastIpAddress;
      device.connected = particle_device.connected;
      device.attached = true;
      device.save();
      return device;
    })
    .then(function(device) {
      res.jsonp(device);
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Particle unable to attach to ' + req.body.device.name,
        message: error.message
      });
    })
    .done();
};

exports.detach_particle = function(req, res) {
  return new Q(Device.findById(req.body.deviceID).exec())
    .then(function(device) {
      device.particleName = '';
      device.lastHeard = '';
      device.lastIpAddress = '';
      device.connected = false;
      device.attached = false;
      device.save();
      return device;
    })
    .then(function(device) {
      res.jsonp(device);
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Particle unable to attach to ' + req.body.device.name,
        message: error.message
      });
    })
    .done();
};

exports.refresh_pool = function(req, res) {
  Device.find().sort('-created').populate(devicePopulate).exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

exports.pool = function(req, res) {
  Device.find({
    _devicePool: req.body.devicePoolID
  }).sort('-created').populate(devicePopulate).exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

exports.refresh = function(req, res) {
  Device.find().sort('-created').populate(devicePopulate).exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

exports.flash_firmware = function(req, res) {
  particle.get_particle_device(req.user, req.body.device)
    .then(function(particle_device) {
      return particle.reflash(particle_device);
    })
    .then(function(result) {
      result.msg = 'Particle firmware reflashed for ' + req.body.device.name;
      res.jsonp(result);
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Particle reflash failed  for ' + req.body.device.name,
        message: error.message
      });
    })
    .done();
};

exports.move_to_and_set_calibration_point = function(req, res) {
  particle.get_particle_device(req.user, req.body.device)
    .then(function(particle_device) {
      return particle.execute_particle_command(particle_device, 'set_calibration_point', req.body.device.calibrationSteps);
    })
    .then(function(result) {
      result.msg = req.body.device.name + ' moved to calibration point';
      res.jsonp(result);
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Calibration failed for ' + req.body.device.name,
        message: error.message
      });
    })
    .done();
};

exports.claim = function(req, res) {
  console.log(req.body);
  var releasePromise = new Q();
  if (req.body.currentDeviceID) {
    releasePromise = particle.get_particle_device_from_uuid(req.user, req.body.currentDeviceID)
        .spread(function(device, particle_device) {
          return [device, particle.execute_particle_command(particle_device, 'release_device', device)];
        })
        .spread(function(device, result) {
          result.msg = device.name + ' released';
          device.claimed = false;
          device.save();
        });
  }
  releasePromise
    .then(function(){
      console.log('Getting particle device');
      return particle.get_particle_device_from_uuid(req.user, req.body.newDeviceID);
    })
    .spread(function(device, particle_device) {
      console.log('Claiming device');
      return [device, particle_device, particle.execute_particle_command(particle_device, 'claim_device', req.user._id)];
    })
    .spread(function(device, particle_device, result) {
      console.log('Checking assay', result);
      if (result.return_value === 9999) { // assay not found in cache; send to particle
        var cartridgeID = particle.get_register_contents();
        new Q(Cartridge.findById(cartridgeID).exec())
          .then(function(cartridge) {
            return Assay.findById(cartridge._assay).exec();
          })
          .then(function(assay) {
            return particle.send_assay_to_particle(particle_device, 'start_send_assay', assay);
          })
          .fail(function(error) {
            console.error(error);
            throw new Error({
              msg: 'Error loading assay into ' + device.name,
              message: error.message
            });
          })
          .done();
      }
      return [device, result];
    })
    .spread(function(device, result) {
      result.msg = device.name + ' claimed';
      device.claimed = true;
      device.save();
      return [device, result];
    })
    .spread(function(device, result) {
      res.jsonp({
        device: device,
        result: result
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Error claiming device ' + req.body.newDeviceID,
        message: error.message
      });
    })
    .done();
};

exports.release = function(req, res) {
  particle.get_particle_device_from_uuid(req.user, req.body.deviceID)
  .spread(function(device, particle_device) {
      return [device, particle.execute_particle_command(particle_device, 'release_device', device)];
    })
    .spread(function(device, result) {
      result.msg = device.name + ' released';
      device.claimed = false;
      device.save();
      return [device, result];
    })
    .spread(function(device, result) {
      res.jsonp({
        device: device,
        result: result
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Error releasing device ' + req.body.device.name,
        message: error.message
      });
    })
    .done();
};

exports.get_test_data = function(req, res) {
  particle.get_particle_device(req.user, req.body.device)
    .then(function(particle_device) {
      return particle_device.execute_particle_request(particle_device, 'test_record', req.body.testID);
    })
    .then(function(register) {
      res.jsonp(register.result);
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Error reading test record ' + req.body.testID + ' on device ' + req.body.device.name,
        message: error.message
      });
    })
    .done();
};
exports.load_by_model = function(req, res) {
  Device.find({
    _deviceModel: req.body.deviceModelID
  }).sort('-created').populate(devicePopulate).exec(function(err, devices) {
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
  return new Q(Device.find({
    $and: [
      {_devicePool: req.user._devicePool},
      {connected: true},
      {attached: true},
      {claimed: {$ne: true}}
    ]
    }).exec())
    .then(function(devices) {
      res.jsonp(devices);
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Error loading device pool ' + req.user._devicePool,
        message: error.message
      });
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

  device.populate(devicePopulate, function(err) {
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
  Device.find().sort('-created').populate(devicePopulate).exec(function(err, devices) {
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
  Device.findById(id).populate(devicePopulate).exec(function(err, device) {
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
