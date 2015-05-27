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
  Prescription = mongoose.model('Prescription'),
  Spark = mongoose.model('Spark'),
  sparkcore = require('spark'),
  sparks = require('../../app/controllers/sparks.server.controller'),
  d3 = require('d3'),
  Q = require('q'),
  _ = require('lodash');

var brevitestSpark = require('../../app/modules/brevitest-particle');
var brevitestCommand = require('../../app/modules/brevitest-command');
var brevitestRequest = require('../../app/modules/brevitest-request');
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
  select: '_id name'
}, {
  path: '_prescription',
  select: '_id name patientNumber patientGender patientDateOfBirth'
}, {
  path: '_cartridge',
  select: '_id name result failed bcodeString rawData startedOn finishedOn'
}];

exports.run = function(req, res) {
  res.send();
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

function bObjectToCodeString(bco) {
  var str = '';

  _.each(bco, function(e, i, a) {
    str += _.findWhere(bcmds, {
      name: e.command
    }).num + (e.params !== '' ? ',' + e.params : '') + (i < a.length - 1 ? '\n' : '');
  });

  return str;
}

function doUpdateTest(user, testID, cartridgeID, deviceID, analysis, standardCurve, percentComplete, status) {
  var sparkDevice, result = {};
  result.percentComplete = percentComplete > 100 ? 100 : percentComplete;
  result.status = percentComplete === 100 ? 'Complete' : (status ? status : 'Unknown');

  return brevitestSpark.get_spark_device_from_deviceID(user, deviceID)
    .then(function(s) {
      sparkDevice = s;

      return new Q(sparkDevice.callFunction('requestdata', cartridgeID + '000000' + brevitestRequest.test_record_by_uuid));
    })
    .then(function(result) {
      if (result.return_value < 0) {
        throw new Error('Request to read register failed');
      }
      return new Q(sparkDevice.getVariable('register'));
    })
    .then(function(register) {

      var data = register.result.split('\n');
      var params = data[0].split('\t');
      result.rawData = register.result;
      result.startedOn = Date(parseInt(params[1]));
      result.finishedOn = Date(parseInt(params[2]));
      result.value = parseInt(data[4].split('\t')[3]) - parseInt(data[2].split('\t')[3]);
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
        console.log(result.value, analysis, standardCurve);
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

function createSparkSubscribeCallback(test, socket, user, analysis, standardCurve) {
  console.log('Setting up spark callback');
  return function sparkSubscribeCallback(event) {
    var data = event.data.split('\n');

    test.percentComplete = data[2] ? parseInt(data[2]) : 0;
    if (test.percentComplete === 100) {
      test.status = 'Complete';
      doUpdateTest(user, test._id, test._cartridge, test._device, analysis, standardCurve, test.percentComplete, test.status)
      .done();
    } else {
      test.status = data[0].length ? data[0] : test.status;
    }

    test.save();

    socket.sockets.emit('test.update', event.data);
  };
}

exports.begin = function(req, res) {
  var assayID = req.body.assayID;
  var assayName = req.body.assayName;
  var assayBCODE = req.body.assayBCODE;
  var analysis = req.body.analysis;
  var standardCurve = req.body.standardCurve;
  var cartridgeID = req.body.cartridgeID;
  var deviceID = req.body.deviceID;
  var deviceName = req.body.deviceName;
  var prescriptionID = req.body.prescriptionID;
  var test = new Test();
  var bcodeString, sparkDevice;

  brevitestSpark.get_spark_device_from_deviceID(req.user, deviceID)
    .then(function(s) {
      sparkDevice = s;

      var duration, max_payload, packet_count;
      var end, i, len, num, payload, start;
      var args = [];

      bcodeString = bObjectToCodeString(assayBCODE);
      duration = get_BCODE_duration(assayBCODE);
      max_payload = (56 - cartridgeID.length); // max string = 63 - length(command code) - length(num) - length(len) - length(cartridgeId)
      packet_count = Math.ceil(bcodeString.length / max_payload);

      args.push(brevitestCommand.receive_BCODE + '000' + zeropad(packet_count, 2) + cartridgeID);
      for (i = 1; i <= packet_count; i += 1) {
        start = (i - 1) * max_payload;
        end = start + max_payload;
        payload = bcodeString.substring(start, end);
        len = zeropad(payload.length, 2);
        num = zeropad(i, 3);
        args.push(brevitestCommand.receive_BCODE + num + len + cartridgeID + payload);
      }

      args.push(brevitestCommand.run_test + cartridgeID + zeropad(Math.round(duration), 4));
      return args.reduce(function(soFar, arg) {
        return soFar.then(function() {
          return sparkDevice.callFunction('runcommand', arg);
        });
      }, new Q());
    })
    .then(function(result) {
      if (result.return_value !== 1) {
        throw new Error('Test not started');
      }

      test.user = req.user;
      test._assay = assayID;
      test._device = deviceID;
      test._cartridge = cartridgeID;
      test._prescription = prescriptionID;
      test.name = req.body.name ? req.body.name : ('Assay ' + assayName + ' on device ' + deviceName + ' using cartridge ' + cartridgeID);
      test.status = 'Starting';
      test.percentComplete = 0;
      test.startedOn = new Date();
      return new Q(test.save());
    })
    .then(function() {
      return new Q(Cartridge.findOneAndUpdate({
        _id: cartridgeID
      }, {
        _test: test._id,
        _device: deviceID,
        startedOn: test.startedOn,
        _runBy: test.user
      }).exec());
    })
    .then(function() {
      return new Q(Prescription.findOne({
        _id: prescriptionID
      }).exec());
    })
    .then(function(prescription) {
      prescription._tests.push(test._id);
      return new Q(prescription.save());
    })
    .then(function() {
      sparkDevice.subscribe(cartridgeID, createSparkSubscribeCallback(test, req.app.get('socketio'), req.user, analysis, standardCurve));

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

  var testID = req.body.testID;
  var cartridgeID = req.body.cartridgeID;
  var deviceID = req.body.deviceID;
  var now = new Date();

  brevitestSpark.get_spark_device_from_deviceID(req.user, deviceID)
    .then(function(sparkDevice) {
      return new Q(sparkDevice.callFunction('runcommand', brevitestCommand.cancel_process));
    })
    .then(function(register) {
      return new Q(Cartridge.findOneAndUpdate({
        _id: cartridgeID
      }, {
        finishedOn: now,
        failed: true
      }, {
        new: true
      }).exec());
    })
    .then(function(cartridge) {
      return new Q(Test.findOneAndUpdate({
        _id: testID
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
  console.log(req.body);
  console.log(req.user, req.body.testID, req.body.cartridgeID, req.body.deviceID, req.body.analysis, req.body.standardCurve, req.body.percentComplete, req.body.status);
  doUpdateTest(req.user, req.body.testID, req.body.cartridgeID, req.body.deviceID, req.body.analysis, req.body.standardCurve, req.body.percentComplete, req.body.status)
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
