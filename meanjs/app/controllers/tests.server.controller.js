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
  Q = require('q'),
  _ = require('lodash');

exports.run = function(req, res) {
  res.send();
};

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

var brevitestRequest = {
  'serial_number': '00',
  'test_record': '01',
  'test_record_by_uuid': '02',
  'all_params': '03',
  'one_param': '04'
};

var bcmds = [{
  num: '0',
  name: 'Start Test',
  param_count: 2,
  description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor integration time, sensor gain).'
}, {
  num: '1',
  name: 'Delay',
  param_count: 1,
  description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'
}, {
  num: '2',
  name: 'Move',
  param_count: 2,
  description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'
}, {
  num: '3',
  name: 'Solenoid On',
  param_count: 1,
  description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'
}, {
  num: '4',
  name: 'Device LED On',
  param_count: 0,
  description: 'Turns on the device LED, which is visible outside the device. No parameters.'
}, {
  num: '5',
  name: 'Device LED Off',
  param_count: 0,
  description: 'Turns off the device LED. No parameters.'
}, {
  num: '6',
  name: 'Device LED Blink',
  param_count: 2,
  description: 'Blinks the device LED at a specified rate. Parameters, (number of blinks, period in milliseconds between change in LED state).'
}, {
  num: '7',
  name: 'Sensor LED On',
  param_count: 1,
  description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'
}, {
  num: '8',
  name: 'Sensor LED Off',
  param_count: 0,
  description: 'Turns off the sensor LED. No parameters.'
}, {
  num: '9',
  name: 'Read Sensors',
  param_count: 2,
  description: 'Takes readings from the sensors. Parameters are (number of samples [1-10], milliseconds between samples).'
}, {
  num: '10',
  name: 'Read QR Code',
  param_count: 0,
  description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'
}, {
  num: '11',
  name: 'Disable Sensor',
  param_count: 0,
  description: 'Disables the sensors, switching them to low-power mode. No parameters.'
}, {
  num: '12',
  name: 'Repeat Begin',
  param_count: 1,
  description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'
}, {
  num: '13',
  name: 'Repeat End',
  param_count: 0,
  description: 'Ends the innermost block of repeated commands. No parameters.'
}, {
  num: '14',
  name: 'Status',
  param_count: 2,
  description: 'Changes the device status register, which used in remote monitoring. Parameters are (message length, message text).'
}, {
  num: '99',
  name: 'Finish Test',
  param_count: 0,
  description: 'Finishes the test. Required to be the final command. No parameters.'
}];

function instruction_time(code, param) {
  var p, d = 0;

  switch (code) {
    case 'Delay': // delay
    case 'Solenoid On': // solenoid on
      d = parseInt(param[0]);
      break;
    case 'Move': // move
      d = Math.floor(parseInt(param[0]) * parseInt(param[1]) / 1000);
      break;
    case 'Blink Device LED': // blink device LED
      d = 2 * Math.floor(parseInt(param[0]) * parseInt(param[1]));
      break;
    case 'Read Sensor': // read sensor
      d = Math.floor(parseInt(param[0]) * parseInt(param[1]));
      break;
    case 'Finish Test': // finish
      d = 16800;
      break;
  }

  return d;
}

function get_bcode_object(bcode) {
  return ({
    c: bcode.command,
    p: bcode.params && bcode.params.toString().indexOf(',') !== -1 ? bcode.params.toString().split(',') : bcode.params
  });
}

function calculate_BCODE_time(bcode_array) {
  var a, b, i, level, t;
  var duration = 0;

  for (i = 0; i < bcode_array.length; i += 1) {
    if (bcode_array[i]) {
      b = get_bcode_object(bcode_array[i]);
      switch (b.c) {
        case 'Finish Test': // finished
        case 'Repeat End': // end repeat
          return (duration + instruction_time(b.c, b.p));
        case '':
          break;
        case 'Repeat Begin': // start repeat
          a = [];
          level = 1;
          do {
            i += 1;
            if (i === bcode_array.length) {
              return -1;
            }
            t = get_bcode_object(bcode_array[i]);
            if (t.c === 'Repeat Begin') {
              level += 1;
            }
            if (t.c === 'Repeat End') {
              level -= 1;
            }
            a.push(bcode_array[i]);
          } while (!(t.c === 'Repeat End' && level === 0));

          duration += calculate_BCODE_time(a) * parseInt(b.p[0]);
          break;
        default:
          duration += instruction_time(b.c, b.p);
      }
    }
  }

  return -1;
}

function get_BCODE_duration(a) {
  var duration = 0;
  var repLevel = 0;

  if (a && a.length) {
    a.forEach(function(e) {
      if (e.command === 'Repeat Begin') {
        repLevel += 1;
      }
      if (e.command === 'Repeat End') {
        repLevel -= 1;
      }
    });

    if (repLevel !== 0) {
      return -1;
    }

    duration = calculate_BCODE_time(a);
  }

  return (duration / 1000);
}

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

var updating = false;

function updateTestInProgress(sparkDevice, test) {
  if (!sparkDevice.attributes.connected) {
    throw new Error(test._device.name + ' not connected');
  }

  new Q(sparkDevice.getVariable('testrunning'))
  .then(function(v) {
    if (test._cartridge.toHexString() === v.result) { // test t is underway on this device
      test.status = 'In progress';
      return true;
    }
    else {
      if (test.status !== 'Cancelled') {
        test.status = 'Complete';
      }
      return false;
    }
  })
  .then(function(test_in_progress) {
    if (test_in_progress) {
      return new Q(sparkDevice.getVariable('percentdone'));
    }
    else {
      if (test.status === 'Cancelled') {
        return {result: test.percentComplete};
      }
      else {
        return {result: 100};
      }
    }
  })
  .then(function(pctDone) {
    test.percentComplete = pctDone.result;
    console.log('save');
    test.save();
    return test;
  })
  .fail(function(err) {
    console.log('Error', sparkDevice, test);
    throw new Error(err);
  })
  .done();
}

exports.start_daemon = function(sparkDevice, test) {
  var startTime = new Date();
  var timeoutLimit = 1200000; // timeout after 20 minutes
  var runInterval = 5000; // check every 5 seconds
  updating = true;
  (function doIt() {
    setTimeout(function() {
      updateTestInProgress(sparkDevice, test);
      var now = new Date();
      if ((now - startTime) > timeoutLimit) {
        updating = false;
      }
    }, runInterval)
    .then(function() {
      if (updating) {
        doIt();
      }
    }, function(err) {
      console.log(err);
    });
  })();
};

exports.stop_daemon = function() {
  updating = false;
};

exports.begin = function(req, res) {
  var bcode, bcode_str, cartridge, device, max_payload, packet_count, sparkDevice, sparkID, step, test;

  Q.fcall(function(id) {
      step = 'Device.findOneAndUpdate';
      return new Q(Device.findOneAndUpdate({
        _id: id
      }, {
        status: 'Test in progress'
      }).populate('_spark', 'sparkID').exec());
    }, req.body.deviceID)
    .then(function(d) {
      step = 'Spark login';
      device = d;
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88'
      }));
    })
    .then(function() {
      step = 'Spark listDevices';
      console.log(step, sparkID);

      return new Q(sparkcore.listDevices());
    })
    .then(function(sparkDevices) {
      step = 'Check whether device is online';
      console.log(step, sparkDevices);

      sparkDevice = _.findWhere(sparkDevices, {
        id: sparkID
      });
      if (!sparkDevice.attributes.connected) {
        throw new Error(device.name + ' is not online.');
      }
    })
    .then(function() {
      step = 'Create test';

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
      step = 'Update cartridge';
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
      step = 'Load BCODE';
      return new Q(Assay.findById({
        _id: c._assay
      }).exec());
    })
    .then(function(a) {
      step = 'Send BCODE and start test';
      console.log(step);

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
      step = 'Return response';
      console.log(step, result);

      if (result.return_value === 1) {
        res.jsonp({
          message: 'Test started',
          test: test,
          sparkDevice: sparkDevice
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
    .then(function(v) {
      if (c.toHexString() === v.result) { // test t is underway on this device
        test.status = 'In progress';
        return true;
      }
      else {
        if (test.status !== 'Cancelled') {
          test.status = 'Complete';
        }
        return false;
      }
    })
    .then(function(test_in_progress) {
      if (test_in_progress) {
        return new Q(s.getVariable('percentdone'));
      }
      else {
        if (test.status === 'Cancelled') {
          return {result: test.percentComplete};
        }
        else {
          return {result: 100};
        }
      }
    })
    .then(function(pctDone) {
      test.percentComplete = pctDone.result;
      console.log('save');
      test.save();
      return test;
    });
}

exports.status = function(req, res) {
  console.log('Test status');

  var sparkDevice, sparkID;
  var tests = req.body.tests;
  var testIDs = _.uniq(_.pluck(_.pluck(tests, '_device'), '_id'));

  new Q(Device.find({_id : {$in: testIDs}}).populate('_spark', 'sparkID').exec())
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

exports.monitor = function(req, res) {
  res.jsonp({
    message: 'Monitoring started'
  });
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
    select: '_id name'
  }, {
    path: '_device',
    select: '_id name _spark'
  }, {
    path: '_cartridge',
    select: '_id name result failed BCODE startedOn finishedOn'
  }]).exec(function(err, tests) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(tests);
    }
  });
};

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
    select: '_id name standardCurve'
  }, {
    path: '_device',
    select: '_id name'
  }, {
    path: '_prescription',
    select: '_id name patientNumber patientGender patientDateOfBirth'
  }, {
    path: '_cartridge',
    select: '_id name result failed rawData startedOn finishedOn'
  }]).exec(function(err, tests) {
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
