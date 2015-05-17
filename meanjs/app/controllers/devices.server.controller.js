'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Device = mongoose.model('Device'),
  sparkcore = require('spark'),
  Q = require('q'),
  _ = require('lodash');

var brevitestCommand = {
  'write_serial_number': '00',
  'initialize_device': '01',
  'run_test': '02',
  'sensor_data': '03',
  'change_param': '04',
  'reset_params': '05',
  'erase_archive': '06',
  'dump_archive': '07',
  'archive_size': '08',
  'firmware_version': '09',
  'cancel_process': '10',
  'receive_BCODE': '11',
  'device_ready': '12',
  'calibrate': '13'
};

function errorCallback(err) {
  return err;
}

exports.move_to_and_set_calibration_point = function(req, res) {
  var device, sparkID, step;

  Q.fcall(function(id) {
      step = 'Device.findById';
      console.log(step, id);
      return new Q(Device.findById(id).populate('_spark', 'sparkID').exec());
    }, req.body.device._id)
    .then(function(d) {
      step = 'Spark login';
      console.log(step, d);
      device = d;
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({ username: 'leo3@linbeck.com', password: '2january88' }));
    })
    .then(function() {
      step = 'Spark listDevices';
      console.log(step, sparkID);
      return new Q(sparkcore.listDevices());
    })
    .then(function(sparkDevices) {
      var sparkDevice = _.findWhere(sparkDevices, {id: sparkID});
      step = 'Spark callFunction';
      console.log(step, sparkDevice);
      if (!sparkDevice.attributes.connected) {
        throw new Error(device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('runcommand', brevitestCommand.calibrate + device.calibrationSteps));
    })
    .then(function(result) {
      var response;

      step = 'Return response';
      console.log(step, result);
      if (result.return_value === 1) {
        response = device.name + ' moved to calibration point';
      }
      else {
        throw new Error('Calibration failed');
      }
      res.jsonp({
        result: response
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        message: error.message,
        step: step
      });
    })
    .done();
};

exports.initialize = function(req, res) {
  var device, sparkID, step;

  console.log('device.initialize');
  Q.fcall(function(id) {
      step = 'Device.findById';
      console.log(step, id);
      return new Q(Device.findById(id).populate('_spark', 'sparkID').exec());
    }, req.body.device._id)
    .then(function(d) {
      step = 'Spark login';
      console.log(step, d);
      device = d;
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({ username: 'leo3@linbeck.com', password: '2january88' }));
    })
    .then(function() {
      step = 'Spark listDevices';
      console.log(step, sparkID);
      return new Q(sparkcore.listDevices());
    })
    .then(function(sparkDevices) {
      var sparkDevice = _.findWhere(sparkDevices, {id: sparkID});
      step = 'Spark callFunction';
      console.log(step, sparkDevice);
      if (!sparkDevice.attributes.connected) {
        throw new Error(device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('runcommand', brevitestCommand.initialize_device));
    })
    .then(function(result) {
      var response;

      step = 'Return response';
      console.log(step, result);
      if (result.return_value === 1) {
        response = 'Initialization successfully started';
      }
      else {
        throw new Error('Initialization failed to start');
      }
      res.jsonp({
        result: response
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        message: error.message,
        step: step
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

  device.populate([{
    path: '_deviceModel',
    select: '_id name'
  }, {
    path: '_spark',
    select: '_id name sparkID'
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
  Device.find().sort('-created').populate('user', 'displayName').exec(function(err, devices) {
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
    select: '_id name'
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
