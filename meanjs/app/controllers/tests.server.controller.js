'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Test = mongoose.model('Test'),
  Assay = mongoose.model('Assay'),
  Cartridge = mongoose.model('Cartridge'),
  Device = mongoose.model('Device'),
  d3 = require('d3'),
  Q = require('q'),
  _ = require('lodash');

var particle = require('../../app/modules/brevitest-particle');
var bt = require('../../app/modules/brevitest-BCODE');
var bcmds = bt.BCODE;
var get_BCODE_duration = bt.calculate_duration;

var testPopulate = [{
  path: 'user',
  select: 'displayName'
}, {
  path: '_assay',
  select: '_id name standardCurve analysis'
}, {
  path: '_device',
  select: '_id name particleID'
}, {
  path: '_cartridge',
  select: '_id name value failed bcodeString rawData startedOn finishedOn'
}];

exports.run = function(req, res) {
  res.send();
};

function parseCartridgeFromParticleData(register, test) {
  var updateObj = {};
  var data = register.split('\n');
  var params = data[0].split('\t');

  updateObj.startedOn = Date(parseInt(params[0]));
  updateObj.finishedOn = Date(parseInt(params[1]));
  updateObj.failed = test.percentComplete < 100;
  if (test.status !== 'Cancelled') {
    updateObj.rawData = register;
    updateObj.value = parseInt(data[4].split('\t')[3]) - parseInt(data[2].split('\t')[3]);
  }
  console.log('cartridge', updateObj);

  return updateObj;
}

function parseTestFromParticleData(test, cartridge) {
  var updateObj = {};
  updateObj.percentComplete = test.percentComplete;
  updateObj.status = test.status ? test.status : 'Unknown';

  if (test.status === 'Cancelled') {
    updateObj.reading = null;
    updateObj.result = 'Cancelled';
  }
  else {
    if (typeof cartridge.value === 'undefined') {
      updateObj.reading = null;
    }
    else {
      updateObj.reading = d3.scale.linear().domain(_.pluck(test.standardCurve, 'x')).range(_.pluck(test.standardCurve, 'y'))(cartridge.value);
    }

    if (updateObj.reading !== null && test.analysis) {
      if (updateObj.reading > test.analysis.redMax || updateObj.reading < test.analysis.redMin) {
        updateObj.result = 'Positive';
      } else if (updateObj.reading > test.analysis.greenMax || updateObj.reading < test.analysis.greenMin) {
        updateObj.result = 'Borderline';
      } else {
        updateObj.result = 'Negative';
      }
    }
    else {
      updateObj.result = 'Unknown';
    }
  }
  updateObj.loaded = true;

  return updateObj;
}

function finalizeTestRecord(user, test) {
  return new Q(particle.get_particle_device_from_uuid(user, test._device))
    .spread(function(device, particle_device) {
      return particle.execute_particle_request(particle_device, 'test_record', test._id);
    })
    .then(function(register) {
      var updateQuery = parseCartridgeFromParticleData(register, test);
      return [Cartridge.findByIdAndUpdate(test._cartridge, updateQuery, {new: true}).exec()];
    })
    .spread(function(cartridge) {
      console.log('cartridge record', cartridge);
      var updateQuery = parseTestFromParticleData(test, cartridge);
      return Test.findByIdAndUpdate(test._id, updateQuery, {new: true}).exec();
    });
}

function verify_test_data_downloaded(user, uuidStr) {
  // verify that test data has been downloaded from device
  var uuids = uuidStr.split('\n');
  var promise = new Q();
  uuids.forEach(function(uuid) {
    promise = promise.then(function() {
      return Test.findById(uuid).exec();
    })
    .then(function(test) {
      if (!test.loaded) {
        return finalizeTestRecord(user, test);
      }
      else {
        return null;
      }
    });
  });

  return promise;
}

function createParticleSubscribeCallback(user, test, socket) {
  return function particleSubscribeCallback(event) {
    var data = event.data.split('\n');

    socket.emit('test.update', event.data);

    test.percentComplete = data[2] ? parseInt(data[2]) : 0;
    if (test.percentComplete === 100 && test.status !== 'Cancelled') {
      test.status = 'Complete';
      if (!test.loaded) {
        finalizeTestRecord(user, test)
          .fail(function(err) {
            console.log('finalizeTestRecord error', err, user, test);
          })
          .done();
      }
    }
    else {
      test.status = data[0].length ? data[0] : test.status;
      test.save();
    }
  };
}

exports.begin = function(req, res) {
  var bcodeString, test;
  console.log('Beginning test', req.body);
  particle.get_particle_device_from_uuid(req.user, req.body.deviceID)
    .spread(function(device, particle_device) {
      return [device, particle_device, particle.execute_particle_request(particle_device, 'test_uuids')];
    })
    .spread(function(device, particle_device, request) {
      console.log('test uuids:', request);
      return [device, particle_device, verify_test_data_downloaded(req.user, request)];
    })
    .spread(function(device, particle_device) {
      return [device, particle_device, particle.execute_particle_command(particle_device, 'verify_qr_code', req.body.cartridgeID)];
    })
    .spread(function(device, particle_device, result) {
      if (result.return_value !== 0) {
        throw new Error('Error verifying cartridge, code = ' + result.return_value);
      }
      return [device, particle_device, test, Assay.findById(req.body.assayID).exec()];
    })
    .spread(function(device, particle_device, test, assay) {
      test = new Test();
      test.user = req.user;
      test.reference = req.body.reference;
      test.subject = req.body.subject;
      test.description = req.body.description;
      test.standardCurve = assay.standardCurve;
      test.analysis = assay.analysis;
      test._assay = req.body.assayID;
      test._device = req.body.deviceID;
      test._cartridge = req.body.cartridgeID;
      test.status = 'Starting';
      test.percentComplete = 0;
      test.save();
      return [device, particle_device, test, assay, particle.send_test_to_particle(particle_device, test)];
    })
    .spread(function(device, particle_device, test, assay, result) {
      if (result.return_value < 0) {
        throw new Error('Error loading test data into device, code = ' + result.return_value);
      }
      return [device, particle_device, test, assay, particle.execute_particle_command(particle_device, 'run_test', test._id)];
    })
    .spread(function(device, particle_device, test, assay, result) {
      if (result.return_value < 0) { // test failed to start
        test.user = req.user;
        test.status = 'Failed';
        test.percentComplete = -1;
        test.save();
      }
      return [device, particle_device, test, assay, result];
    })
    .spread(function(device, particle_device, test, assay, result) {
      if (result.return_value < 0) { // test failed to start
        throw new Error('Unable to start test ' + test.reference);
      }

      var updateObj = {
        _test: test._id,
        _device: req.body.deviceID,
        startedOn: new Date(),
        bcodeString: particle.get_BCODE_string(assay.BCODE),
        _runBy: test.user
      };
      return [device, particle_device, test, assay, Cartridge.findByIdAndUpdate(req.body.cartridgeID, updateObj, {new: true}).exec()];
    })
    .spread(function(device, particle_device, test, assay, cartridge) {
      particle.start_monitor(particle_device, test._id, createParticleSubscribeCallback(req.user, test, req.app.get('socketio')));

      res.jsonp({
        message: 'Test started',
        device: device,
        test: test,
        assay: assay,
        cartridge: cartridge
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        msg: 'Error running Brevitest™ on device ' + req.body.deviceName,
        message: error.message
      });
    })
    .done();
};

exports.cancel = function(req, res) {
  console.log('Cancelling test');
  particle.get_particle_device_from_uuid(req.user, req.body.deviceID)
    .spread(function(device, particle_device) {
      return particle.execute_particle_command(particle_device, 'cancel_test', req.body.testID);
    })
    .then(function(result) {
      if (result.return_value < 0) {
        throw new Error('Unable to cancel test on device ' + req.body.deviceName);
      }
      var updateObj = {
        finishedOn: new Date(),
        failed: true
      };
      return Cartridge.findByIdAndUpdate(req.body.cartridgeID, updateObj, {new: true}).exec();
    })
    .then(function(cartridge) {
      var updateObj = {
        status: 'Cancelled'
      };
      return [cartridge, Test.findByIdAndUpdate(req.body.testID, updateObj, {new: true}).exec()];
    })
    .spread(function(cartridge, test) {
      res.jsonp({
        result: 'Cancelled',
        cartridge: cartridge,
        test: test
      });
    })
    .fail(function(error) {
      console.log('Cancel process failed', error);
      return res.status(400).send({
        msg: 'Error cancelling test ' + req.body.testID + ' on device ' + req.body.deviceName,
        message: error.message
      });
    })
    .done();
};

exports.recently_started = function(req, res) {
  new Q(Cartridge.find({
      startedOn: {
        $gt: new Date(new Date().valueOf() - 14400000) // last 4 hours
      }
    }).exec())
    .then(function(cartridges) {
      var ids = _.pluck(cartridges, '_id');
      return Test.find({
        _cartridge: {
          $in: ids
        }
      }).sort('-created').populate(testPopulate).limit(20).exec();
    })
    .then(function(tests) {
      res.jsonp(tests);
    })
    .fail(function(error) {
      console.log('Status update failed');
      return res.status(400).send({
        message: error
      });
    })
    .done();
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

  test.populate(testPopulate, function(err) {
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
  Test.find().limit(20).sort('-created').populate('user', 'displayName').exec(function(err, tests) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(tests);
    }
  });
};

exports.load = function(req, res) {
  Test.find({
    _cartridge: {
      $exists: true
    }
  }).paginate(req.body.page, req.body.pageSize).sort('-created').populate(testPopulate).exec(function(err, tests, total) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Test.count().exec(function(err, count) {
        res.jsonp({
          tests: tests,
          total_count: count
        });
      });
    }
  });
};

/**
 * Test middleware
 */
exports.testByID = function(req, res, next, id) {
  Test.findById(id).populate(testPopulate).exec(function(err, test) {
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
