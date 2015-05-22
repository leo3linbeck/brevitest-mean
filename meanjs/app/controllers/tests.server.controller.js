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
  Spark = mongoose.model('Spark'),
  sparkcore = require('spark'),
  sparks = require('../../app/controllers/sparks.server.controller'),
  Q = require('q'),
  _ = require('lodash');

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
  var cartridge, device, sparkDevice, sparkID, step, test;

  Q.fcall(function(id) {
      console.log('Device.findOneAndUpdate');
      return new Q(Device.findOneAndUpdate({
        _id: id
      }, {
        status: 'Test in progress'
      }).populate('_spark', 'sparkID').exec());
    }, req.body.deviceID)
    .then(function(d) {
      console.log('Spark login');
      device = d;
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88'
      }));
    })
    .then(function() {
      console.log('Spark listDevices', sparkID);

      return new Q(sparkcore.listDevices());
    })
    .then(function(sparkDevices) {
      console.log('Check whether device is online', sparkDevices);

      sparkDevice = _.findWhere(sparkDevices, {
        id: sparkID
      });
      if (!sparkDevice.attributes.connected) {
        throw new Error(device.name + ' is not online.');
      }
    })
    .then(function() {
      console.log('Create test');

      test = new Test();
      test.user = req.user;
      test._assay = req.body.assayID;
      test._device = req.body.deviceID;
      test._cartridge = req.body.cartridgeID;
      test._prescription = req.body.prescriptionID;
      test.name = req.body.name ? req.body.name : ('Assay ' + req.body.assayID + ' on device ' + req.body.deviceID + ' using cartridge ' + req.body.cartridgeID);
      test.description = req.body.description;
      test.status = 'Starting';
      test.percentComplete = 0;
      test.startedOn = new Date();

      test.save(function(err) {
        if (err) {
          throw new Error(err);
        }
      });

      return test;
    })
    .then(function(t) {
      console.log('Update cartridge');
      return new Q(Cartridge.findOneAndUpdate({
        _id: t._cartridge
      }, {
        _test: t._id,
        _device: req.body.deviceID,
        startedOn: t.startedOn,
        _runBy: t.user
      }).exec());
    })
    .then(function(c) {
      console.log('Load BCODE');
      return new Q(Assay.findById({
        _id: c._assay
      }).exec());
    })
    .then(function(a) {
      console.log('Send BCODE and start test');

      var bcode, bcode_str, max_payload, packet_count;
      var end, i, len, num, payload, start;
      var args = [];

      bcode = a.BCODE;
      bcode_str = bObjectToCodeString(bcode);
      max_payload = (56 - req.body.cartridgeID.length); // max string = 63 - length(command code) - length(num) - length(len) - length(cartridgeId)
      packet_count = Math.ceil(bcode_str.length / max_payload);

      args.push(brevitestCommand.receive_BCODE + '000' + zeropad(packet_count, 2) + req.body.cartridgeID);
      for (i = 1; i <= packet_count; i += 1) {
        start = (i - 1) * max_payload;
        end = start + max_payload;
        payload = bcode_str.substring(start, end);
        len = zeropad(payload.length, 2);
        num = zeropad(i, 3);
        args.push(brevitestCommand.receive_BCODE + num + len + req.body.cartridgeID + payload);
      }

      args.push(brevitestCommand.run_test + req.body.cartridgeID + zeropad(Math.round(get_BCODE_duration(bcode)), 4));
      console.log(args);
      return args.reduce(function(soFar, arg) {
        return soFar.then(function() {
          return sparkDevice.callFunction('runcommand', arg);
        });
      }, new Q());

    })
    .then(function(result) {
      console.log('Return response', result);
      var testID = test._id.toHexString();
      if (result.return_value === 1) {
        res.jsonp({
          message: 'Test started',
          testID: testID
        });
      } else {
        throw new Error('Test not started');
      }
    })
    .fail(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
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
      console.log('Spark devices', devices);

      var sparkDevice = _.findWhere(devices, {
        id: sparkID
      });
      console.log(sparkDevice);
      if (!sparkDevice.attributes.connected) {
        throw new Error(test._device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('requestdata', test._cartridge + '000000' + brevitestRequest.test_record_by_uuid));
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
      var data, cmd, i = 2, params;

      cartridge.rawData = register.result;
      data = cartridge.rawData.split('\n');
      params = data[0].split('\t');
      cartridge.startedOn = Date(parseInt(params[1]));
      cartridge.finishedOn = Date(parseInt(params[2]));
      cartridge.result = parseInt(data[4].split('\t')[3]) - parseInt(data[2].split('\t')[3]);
      cartridge.control = parseInt(data[5].split('\t')[3]) - parseInt(data[3].split('\t')[3]);
      cartridge.failed = test.percentComplete < 100;
      console.log(cartridge.result, cartridge.control);
      return new Q(cartridge.save());
    })
    .then(function() {
      test.percentComplete = test.percentComplete > 100 ? 100 : test.percentComplete;
      test.startedOn = cartridge.startedOn;
      test.finishedOn = cartridge.finishedOn;
      test.result = cartridge.result;
      test._cartridge.startedOn = cartridge.startedOn;
      test._cartridge.finishedOn = cartridge.finishedOn;
      test._cartridge.rawData = cartridge.rawData;
      test._cartridge.failed = cartridge.failed;
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

function createStatusPromise(sparkDevices, testID) {
  var c, s, test;

  console.log('status', testID);
  return Q.fcall(function() {
      return new Q(Test.findById(testID).populate([{
        path: '_device',
        select: '_spark name'
      }, {
        path: '_cartridge',
        select: '_id'
      }]).exec());
    })
    .then(function(t) {
      test = t;
      c = test._cartridge._id;
      return new Q(Spark.findById(test._device._spark).exec());
    })
    .then(function(spk) {
      s = _.findWhere(sparkDevices, {
        id: spk.sparkID
      });
      if (!s.attributes.connected) {
        throw new Error(test._device.name + ' not connected');
      }
      return new Q(s.getVariable('testrunning'));
    })
    .then(function(testrunning) {
      return [testrunning, new Q(s.getVariable('status'))];
    })
    .spread(function(testrunning, status) {
      if (c.toHexString() === testrunning.result) { // test t is underway on this device
        test.status = status.result;
        return true;
      } else {
        if (test.status !== 'Cancelled') {
          test.status = 'Complete';
        }
        return false;
      }
    })
    .then(function(test_in_progress) {
      if (test_in_progress) {
        return new Q(s.getVariable('percentdone'));
      } else {
        if (test.status === 'Cancelled') {
          return {
            result: test.percentComplete
          };
        } else {
          return {
            result: 100
          };
        }
      }
    })
    .then(function(pctDone) {
      test.percentComplete = pctDone.result;
      console.log('save', test);
      test.save();
      return test;
    })
    .done();
}

exports.status = function(req, res) {
  console.log('Test status');

  var sparkDevice, sparkID;
  var tests = req.body.tests;
  var testIDs = _.uniq(_.pluck(_.pluck(tests, '_device'), '_id'));

  new Q(Device.find({
      _id: {
        $in: testIDs
      }
    }).populate('_spark', 'sparkID').exec())
    .then(function(d) {
      return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88'
      }));
    })
    .then(function() {
      return new Q(sparkcore.listDevices());
    })
    .then(function(sparkDevices) {
      var p = [];
      console.log(sparkDevices);
      tests.forEach(function(t) {
        p.push(createStatusPromise(sparkDevices, t._id));
      });
      return Q.allSettled(p);
    })
    .then(function() {
      console.log('find');
      return new Q(Test.find({
        percentComplete: {
          $lt: 100
        }
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
    .then(function(t) {
      res.jsonp(t);
    })
    .fail(function(err) {
      console.log('Status update failed');
    })
    .done();
};

exports.underway = function(req, res) {
  Test.find({
    percentComplete: {
      $lt: 100
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
