'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Spark = mongoose.model('Spark'),
  Device = mongoose.model('Device'),
  Cartridge = mongoose.model('Cartridge'),
  _ = require('lodash'),
  sparkcore = require('spark'),
  fs = require('fs'),
  Q = require('q');

/**
 * Refresh Spark data
 */

var brevitestSpark = require('../../app/modules/brevitest-particle');
var brevitestCommand = require('../../app/modules/brevitest-command');
var brevitestRequest = require('../../app/modules/brevitest-request');

exports.reflash = function(req, res) {
  console.log('Flash firmware', req.body.spark);

  brevitestSpark.get_spark_device_from_spark(req.user, req.body.spark)
    .then(function(sparkDevice) {
      return [sparkDevice, fs.readdirSync('app/firmware')];
    })
    .spread(function(sparkDevice, files) {
      console.log(sparkDevice, files);
      if (!files || !files.length) {
        throw new Error('Firmware folder not found or empty');
      }
      var firmware = [];
      files.forEach(function(f) {
        if (f.substring(0, 8) === 'firmware' && f.substring(f.length - 4) === '.bin') {
          firmware.push(f);
        }
      });
      if (firmware.length !== 1) {
        throw new Error('Firmware folder must have exactly one firmware file');
      }
      return new Q(sparkDevice.flash('app/firmware/' + firmware[0]));
    })
    .then(function(result) {
      res.jsonp(result);
    })
    .fail(
      function(err) {
        console.log('Flashing firmware failed', err);
      })
    .done();
};

exports.erase_archived_data = function(req, res) {
  console.log('Erase archived data', req.body.spark);

  brevitestSpark.get_spark_device_from_spark(req.user, req.body.spark)
    .then(function(sparkDevice) {
      return new Q(sparkDevice.callFunction('runcommand', brevitestCommand.erase_archive));
    })
    .then(function(result) {
      res.send(result);
    })
    .fail(
      function(err) {
        console.log('Erasing archived data failed', err);
      })
    .done();
};

exports.get_archive_size = function(req, res) {
  console.log('Getting archive size', req.body.spark);

  brevitestSpark.get_spark_device_from_spark(req.user, req.body.spark)
    .then(function(sparkDevice) {
      return new Q(sparkDevice.callFunction('runcommand', brevitestCommand.archive_size));
    })
    .then(function(result) {
      res.send(result);
    })
    .fail(
      function(err) {
        console.log('Getting archive size failed', err);
      })
    .done();
};

function zeropad(num, numZeros) {
  var an = Math.abs(num);
  var digitCount = (num === 0 ? 1 : 1 + Math.floor(Math.log(an) / Math.LN10));
  if (digitCount >= numZeros) {
    return num;
  }
  var zeroString = Math.pow(10, numZeros - digitCount).toString().substr(1);
  return num < 0 ? '-' + zeroString.substr(1) + an.toString() : zeroString + an.toString();
}

exports.get_record_by_cartridge_id = function(req, res) {
  console.log('Retrieving record by cartridge number', req.body.spark, req.body.cartridgeID);

  var sparkDevice;
  var cartridgeID = req.body.cartridgeID;

  brevitestSpark.get_spark_device_from_spark(req.user, req.body.spark)
    .then(function(s) {
      sparkDevice = s;
      return new Q(sparkDevice.callFunction('requestdata', cartridgeID + '000000' + brevitestRequest.test_record_by_uuid));
    })
    .then(function(result) {
      console.log('requestdata', result);
      if (result.return_value < 0) {
        throw new Error('Request to read register failed');
      }
      return new Q(sparkDevice.getVariable('register'));
    })
    .then(function(register) {
      console.log('register', register);
      res.jsonp(register.result);
    })
    .fail(
      function(err) {
        console.log('Record retrieval failed', err);
      })
    .done();
};

exports.get_record_by_index = function(req, res) {
  console.log('Retrieving record by number', req.body.spark, req.body.index);
  var sparkDevice;

  brevitestSpark.get_spark_device_from_spark(req.user, req.body.spark)
    .then(function(s) {
      sparkDevice = s;
      return new Q(sparkDevice.callFunction('requestdata', sparkDevice.id.substring(0, 24) + '000000' + brevitestRequest.test_record + req.body.index));
    })
    .then(function(result) {
      console.log('requestdata', result);
      if (result.return_value < 0) {
        throw new Error('Request to read register failed');
      }
      return new Q(sparkDevice.getVariable('register'));
    })
    .then(function(register) {
      console.log('register', register);
      res.jsonp(register.result);
    })
    .fail(
      function(err) {
        console.log('Record retrieval failed', err);
      })
    .done();
};

function getUpdatePromise(e) {
  return new Q(Spark.findOneAndUpdate({
    sparkID: e.sparkID
  }, e, {
    upsert: true
  }).exec());
}

exports.refresh = function(req, res) {
  console.log('Spark start refresh');

  brevitestSpark.get_spark_device_list(req.user, true)
    .then(function(devices) {
      console.log('Update devices', devices);
      var promises = [];
      devices.forEach(function(e) {
        var s = {
          name: e.attributes.name,
          sparkID: e.attributes.id,
          lastHeard: e.attributes.lastHeard,
          lastIpAddress: e.attributes.lastIpAddress,
          connected: e.attributes.connected,
          user: req.user._id
        };
        promises.push(getUpdatePromise(s));
      });
      return Q.allSettled(promises);
    })
    .then(function() {
      return new Q(Spark.find().populate('user', 'displayName').exec());
    })
    .then(function(result) {
      res.send(result);
    })
    .fail(
      function(err) {
        console.log('Spark refresh failed', err);
      })
    .done();
};

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
  var spark = req.spark;

  spark = _.extend(spark, req.body);

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
  var spark = req.spark;

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
  console.log('Spark list');
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
    if (!spark) return next(new Error('Failed to load Spark ' + id));
    req.spark = spark;
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
