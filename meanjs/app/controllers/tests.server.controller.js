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
  Q = require('q'),
  _ = require('lodash');

var brevitestSpark = require('../../app/modules/brevitest-particle');
var brevitestCommand = require('../../app/modules/brevitest-command');
var brevitestRequest = require('../../app/modules/brevitest-request');
var bt = require('../../app/modules/brevitest-BCODE');
var bcmds = bt.BCODE;
var get_BCODE_duration = bt.calculate_duration;

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

exports.begin = function(req, res) {
  console.log(req.body);
  var assayID = req.body.assayID;
  var assayName = req.body.assayName;
  var assayBCODE = req.body.assayBCODE;
  var cartridgeID = req.body.cartridgeID;
  var deviceID = req.body.deviceID;
  var deviceName = req.body.deviceName;
  var prescriptionID = req.body.prescriptionID;
  var test = new Test();
  var bcodeString;

  brevitestSpark.get_spark_device_from_deviceID(req.user, deviceID)
    .then(function(sparkDevice) {
      console.log('Send BCODE and start test');

      var duration, max_payload, packet_count;
      var end, i, len, num, payload, start;
      var args = [];

      bcodeString = bObjectToCodeString(assayBCODE);
      duration = get_BCODE_duration(assayBCODE);
      console.log('BCODE duration', duration);
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
      console.log(args);
      return args.reduce(function(soFar, arg) {
        return soFar.then(function() {
          return sparkDevice.callFunction('runcommand', arg);
        });
      }, new Q());
    })
    .then(function(result) {
      console.log('Return response', result);

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
      console.log('Saving test');
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
    .then(function(success) {
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
  console.log('Cancelling test', req.body.testID);

  var cartridge, sparkDevice, sparkID, test;

  Q.fcall(function(id) {
      return new Q(Test.findById(id).populate([{
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
        select: '_id name result failed rawData startedOn finishedOn'
      }]).exec());
    }, req.body.testID)
    .then(function(t) {
      test = t;
      return new Q(Cartridge.findById(test._cartridge._id).exec());
    })
    .then(function(c) {
      cartridge = c;
      return new Q(Device.findById(test._device._id).populate('_spark', 'sparkID').exec());
    })
    .then(function(device) {
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88'
      }));
    })
    .then(function(token) {
      return new Q(sparkcore.listDevices());
    })
    .then(function(devices) {
      sparkDevice = _.findWhere(devices, {
        id: sparkID
      });
      console.log(sparkDevice);
      if (!sparkDevice.attributes.connected) {
        throw new Error(test._device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('runcommand', 'cancel_process'));
    })
    .then(function() {
      var data, cmd, i = 2,
        params;

      cartridge.finishedOn = new Date();
      cartridge.failed = true;
      return new Q(cartridge.save());
    })
    .then(function() {
      test.startedOn = cartridge.startedOn;
      test.finishedOn = cartridge.finishedOn;
      test.status = 'Cancelled';
      test._cartridge.startedOn = cartridge.startedOn;
      test._cartridge.finishedOn = cartridge.finishedOn;
      test._cartridge.failed = cartridge.failed;
      return new Q(test.save());
    })
    .then(function() {
      console.log('find');
      return new Q(Test.find({
        $and: [{
          percentComplete: {
            $lt: 100
          }
        }, {
          status: {
            $ne: 'Cancelled'
          }
        }]
      }).sort('-created').populate([{
        path: 'user',
        select: 'displayName'
      }, {
        path: '_assay',
        select: '_id name'
      }, {
        path: '_device',
        select: '_id name _spark'
      }, {
        path: '_cartridge',
        select: '_id name result failed BCODE startedOn finishedOn'
      }]).exec());
    })
    .then(function(tests) {
      res.jsonp(tests);
    })
    .fail(
      function(err) {
        console.log('Cancel process failed', err);
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

exports.update_one_test = function(req, res) {
  console.log('Updating one test', req.body.testID);

  var cartridge, sparkDevice, sparkID, test;

  Q.fcall(function(id) {
      return new Q(Test.findById(id).populate([{
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
        select: '_id name result failed rawData startedOn finishedOn'
      }]).exec());
    }, req.body.testID)
    .then(function(t) {
      test = t;
      return new Q(Cartridge.findById(test._cartridge._id).exec());
    })
    .then(function(c) {
      cartridge = c;
      return new Q(Device.findById(test._device._id).populate('_spark', 'sparkID').exec());
    })
    .then(function(device) {
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88'
      }));
    })
    .then(function(token) {
      return new Q(sparkcore.listDevices());
    })
    .then(function(devices) {
      sparkDevice = _.findWhere(devices, {
        id: sparkID
      });
      console.log(sparkDevice);
      if (!sparkDevice.attributes.connected) {
        throw new Error(test._device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('requestdata', test._cartridge._id + '000000' + brevitestRequest.test_record_by_uuid));
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
      var data, cmd, i = 2,
        params;

      cartridge.rawData = register.result;
      data = cartridge.rawData.split('\n');
      params = data[0].split('\t');
      cartridge.startedOn = Date(parseInt(params[1]));
      cartridge.finishedOn = Date(parseInt(params[2]));
      cartridge.result = parseInt(data[4].split('\t')[3]) - parseInt(data[2].split('\t')[3]);
      cartridge.failed = test.percentComplete < 100;
      return new Q(cartridge.save());
    })
    .then(function() {
      var analysis = test._assay.analysis;

      test.percentComplete = test.percentComplete > 100 ? 100 : test.percentComplete;
      test.startedOn = cartridge.startedOn;
      test.finishedOn = cartridge.finishedOn;
      if (cartridge.result > analysis.redMax || cartridge.result < analysis.redMin) {
        test.result = 'Positive';
      } else if (cartridge.result > analysis.greenMax || cartridge.result < analysis.greenMin) {
        test.result = 'Borderline';
      } else {
        test.result = 'Negative';
      }
      test._cartridge.startedOn = cartridge.startedOn;
      test._cartridge.finishedOn = cartridge.finishedOn;
      test._cartridge.rawData = cartridge.rawData;
      test._cartridge.failed = cartridge.failed;
      test._cartridge.result = cartridge.result;
      return new Q(test.save());
    })
    .then(function() {
      res.jsonp(test);
    })
    .fail(
      function(err) {
        console.log('Record retrieval failed', err);
      })
    .done();
};

function createStatusPromise(user, test) {
  var deviceID = test._device._id;
  var cartridgeID = test._cartridge._id;
  var status, percentComplete;

  return brevitestSpark.get_spark_device_from_deviceID(user, deviceID)
    .then(function(sparkDevice) {
      return new Q(sparkDevice.getVariable('status'));
    })
    .then(function(response) {
      var data = response.result.split('\n');

      if (cartridgeID !== data[1]) { // test is not running on this device
        status = 'Complete';
        percentComplete = 100;
      }
      else {   // test t is underway on this device
        percentComplete = data[2] ? parseInt(data[2]) : 0;
        if (percentComplete === 100) {
          status = 'Complete';
        }
        else {
          status = data[0];
        }
      }

      return new Q(Test.findOneAndUpdate({_id: test._id},
      {
        status: status,
        percentComplete: percentComplete
      }).exec());
    })
    .then(function() {
      return {testID: test._id, status: status, percentComplete: percentComplete};
    })
    .fail(function(err) {
      console.log('Status update failed', err);
    });
}

exports.status = function(req, res) {
  console.log('Test status');

  var tests = req.body.tests;

  Q.fcall(function(t) {
      var promises = [];
      t.forEach(function(test) {
        if (test.status !== 'Cancelled') {
          promises.push(createStatusPromise(req.user, test));
        }
      });
      return Q.allSettled(promises);
    }, tests)
    .then(function(resolution) {
      console.log('find', resolution);
      res.jsonp(resolution);
    })
    .fail(function(err) {
      console.log('Status update failed');
    })
    .done();
};

exports.underway = function(req, res) {
  Test.find({
    $and: [{
      percentComplete: {
        $lt: 100
      }
    }, {
      status: {
        $ne: 'Cancelled'
      }
    }]
  }).sort('-created').populate([{
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
    select: '_id name result failed rawData startedOn finishedOn'
  }]).limit(20).exec(function(err, tests) {
    if (err) {
      return res.status(400).send({
        message: err
      });
    } else {
      res.jsonp(tests);
    }
  });
};

exports.monitor = exports.underway;

exports.review = function(req, res) {
  Test.find({
    _cartridge: {
      $exists: true
    }
  }).sort('-created').populate([{
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
    select: '_id name result failed rawData startedOn finishedOn'
  }]).limit(20).exec(function(err, tests) {
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
  }).paginate(req.body.page, req.body.pageSize).sort('-created').populate([{
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
    select: '_id name result failed rawData startedOn finishedOn'
  }]).exec(function(err, tests, total) {
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
