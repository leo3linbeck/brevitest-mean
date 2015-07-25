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
  select: '_id name result failed bcodeString rawData startedOn finishedOn'
}];

exports.run = function(req, res) {
  res.send();
};

function doUpdateTest(user, testID, cartridgeID, deviceID, analysis, standardCurve, percentComplete, status) {
  var result = {};
  result.percentComplete = percentComplete > 100 ? 100 : percentComplete;
  result.status = percentComplete === 100 ? 'Complete' : (status ? status : 'Unknown');

  particle.get_particle_device_from_uuid(user, deviceID)
    .then(function(particle_device) {
      return particle.execute_particle_request(particle_device, 'get_test_record', testID);
    })
    .then(function(register) {
      var reading;

      var data = register.result.split('\n');
      var params = data[0].split('\t');
      result.rawData = register.result;
      result.startedOn = Date(parseInt(params[1]));
      result.finishedOn = Date(parseInt(params[2]));
      result.value = parseInt(data[4].split('\t')[5]) - parseInt(data[2].split('\t')[5]);
      result.failed = result.percentComplete < 100;

      return new Q(Cartridge.findOneAndUpdate({
        _id: cartridgeID
      }, {
        rawData: register.result,
        startedOn: result.startedOn,
        finishedOn: result.finishedOn,
        result: result.value,
        failed: result.failed
      }, {
        new: true
      }).exec());
    })
    .then(function(cartridge) {
      try {
        if (typeof result.value === 'undefined') {
          result.reading = null;
        }
        else {
          result.reading = d3.scale.linear().domain(_.pluck(standardCurve, 'x')).range(_.pluck(standardCurve, 'y'))(result.value);
        }

        if (result.status === 'Cancelled') {
          result.result = 'Cancelled';
        }
        else if (result.reading !== null && analysis) {
          if (result.reading > analysis.redMax || result.reading < analysis.redMin) {
            result.result = 'Positive';
          } else if (result.reading > analysis.greenMax || result.reading < analysis.greenMin) {
            result.result = 'Borderline';
          } else {
            result.result = 'Negative';
          }
        }
        else {
          result.result = 'Unknown';
        }
      }
      catch(e) {
        console.log('Unable to calculate test results');
        result.result = null;
        result.reading = null;
      }

      return new Q(Test.findOneAndUpdate({
        _id: testID
      }, {
        status: result.status,
        percentComplete: result.percentComplete,
        startedOn: result.startedOn,
        finishedOn: result.finishedOn,
        reading: result.reading,
        result: result.result
      }).exec());
    })
    .then(function() {
      return result;
    });
}

function createParticleSubscribeCallback(test, socket, user, analysis, standardCurve) {

  return function particleSubscribeCallback(event) {
    var data = event.data.split('\n');

    test.percentComplete = data[2] ? parseInt(data[2]) : 0;
    if (test.percentComplete === 100) {
      test.status = 'Complete';
      doUpdateTest(user, test._id, test._cartridge, test._device, analysis, standardCurve, test.percentComplete, test.status)
      .fail(function(err) {
        console.log('doUpdateTest error', err);
      })
      .done();
    } else {
      test.status = data[0].length ? data[0] : test.status;
    }

    socket.emit('test.update', event.data);

    test.save();
  };
}

exports.begin = function(req, res) {
  var bcodeString, test;

  particle.get_particle_device(req.user, req.body.device)
    .then(function(particle_device) {
      return [particle_device, particle.execute_particle_command(particle_device, 'claim_device', req.user.id)];
    })
    .spread(function(particle_device, result) {
      if (result.return_value === 9999) {  // assay not found in cache; send to particle
        result = particle.send_assay_to_particle(particle_device, 'start_send_assay', req.body.assay);
        if (result.return_value < 0) {
          throw new Error('Error transferring assay data');
        }
      }
      return particle_device;
    })
    .then(function(particle_device){
      req.body.device.claimed = true;
      req.body.device.save();
      return particle_device;
    })
    .then(function(particle_device){
      return [particle_device, particle.verify_QR_code(particle_device, req.body.cartridgeID)];
    })
    .spread(function(particle_device, result) {
      if (result.return_value < 0) {
        throw new Error('Error validating cartridge, code = ' + result.return_value);
      }
      test = new Test();
      test.user = req.user;
      test._assay = req.body.assayID;
      test._device = req.body.deviceID;
      test._cartridge = req.body.cartridgeID;
      test.name = req.body.name ? req.body.name : ('Assay ' + req.body.assayName + ' on device ' + req.body.deviceName + ' using cartridge ' + req.body.cartridgeID);
      test.status = 'Starting';
      test.percentComplete = 0;
      test.startedOn = new Date();
      test.save();
      return particle_device;
    })
    .then(function(particle_device) {
      return new Q(Cartridge.findOneAndUpdate({
        _id: req.body.cartridgeID
      }, {
        _test: test._id,
        _device: req.body.deviceID,
        startedOn: test.startedOn,
        bcodeString: req.body.bcodestring,
        _runBy: test.user
      }).exec());
    })
    .then(function() {
      particle.subscribe(req.body.cartridgeID, createParticleSubscribeCallback(test, req.app.get('socketio'), req.user, req.body.analysis, req.body.standardCurve));

      res.jsonp({
        message: 'Test started',
        test: test
      });
    })
    .fail(function(err) {
      return res.status(400).send({
        message: err.message
      });
    })
    .done();
};

exports.cancel = function(req, res) {
  console.log('Cancelling test');

  var now = new Date();

  particle.get_particle_device(req.user, req.body.device)
    .then(function(particle_device) {
      return [particle_device, particle.execute_particle_command(particle_device, 'cancel_test', req.user.id)];
    })
    .then(function(register) {
      return new Q(Cartridge.findOneAndUpdate({
        _id: req.body.cartridgeID
      }, {
        finishedOn: now,
        failed: true
      }, {
        new: true
      }).exec());
    })
    .then(function(cartridge) {
      return new Q(Test.findOneAndUpdate({
        _id: req.body.testID
      }, {
        finishedOn: now,
        status: 'Cancelled'
      }).exec());
    })
    .then(function() {
      res.jsonp('Cancelled');
    })
    .fail(
      function(err) {
        console.log('Cancel process failed', err);
        return res.status(400).send({
          message: err
        });
      })
    .done();
};

exports.update_one_test = function(req, res) {
  doUpdateTest(req.user, req.body.testID, req.body.cartridgeID, req.body.deviceID, req.body.analysis, req.body.standardCurve, req.body.percentComplete, req.body.state)
    .then(function(result) {
      res.jsonp(result);
    })
    .fail(
      function(err) {
        console.log('Record retrieval failed', err);
        return res.status(400).send({
          message: err
        });
      })
    .done();
};

exports.status = function(req, res) {
  new Q(Cartridge.find({
      startedOn: {
        $gt: new Date(new Date().valueOf() - 14400000) // last 4 hours
      }
    }).exec())
    .then(function(cartridges) {
      var ids = _.pluck(cartridges, '_id');
      return new Q(Test.find({
        _cartridge: {
          $in: ids
        }
      }).sort('-created').populate(testPopulate).limit(20).exec());
    })
    .then(function(tests) {
      res.jsonp(tests);
    })
    .fail(function(err) {
      console.log('Status update failed');
      return res.status(400).send({
        message: err
      });
    })
    .done();
};

exports.recently_started = exports.status;
exports.monitor = exports.status;

exports.review = function(req, res) {
  Test.find({
    _cartridge: {
      $exists: true
    }
  }).sort('-created').populate(testPopulate).limit(20).exec(function(err, tests) {
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
