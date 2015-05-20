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

var readResult;

function requestAndReadRegister(id, sparkDevice, requestIndex, requestCode, requestParam) {
  var param = id + zeropad(requestIndex, 6) + requestCode + (requestParam ? requestParam : '');
  console.log(param);

  return Q.fcall(function(p) {
    return new Q(sparkDevice.callFunction('requestdata', p));
  }, param)
  .then(function(result) {
    console.log('requestdata', result);
    if (result.return_value < 0) {
      throw new Error('Request to read register failed');
    }
    var register = new Q(sparkDevice.getVariable('register'));
    return [result.return_value, register];
  })
  .spread(function(index, register) {
    console.log('get register', index, register);
    readResult += register.result;
    if(index === 0) {
      console.log('Last call');
      return new Q(sparkDevice.callFunction('requestdata', id + '999999'));
    }
    else {
      return requestAndReadRegister(id, sparkDevice, index, requestCode, requestParam);
    }
  });
}

exports.update_one_test = function(req, res) {
  console.log('Updating one test', req.body.testID);

  var cartridge, sparkDevice, sparkID, test;
  readResult = '';

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

      var sparkDevice = _.findWhere(devices, {id: sparkID});
      console.log(sparkDevice);
      if (!sparkDevice.attributes.connected) {
        throw new Error(test._device.name + ' is not online.');
      }
      return new Q(requestAndReadRegister(test._cartridge, sparkDevice, 0, brevitestRequest.test_record_by_uuid));
    })
    .then(function() {
      var data, cmd, i = 2, params;

      cartridge.rawData = readResult;
      data = cartridge.rawData.split('\n');
      params = data[0].split('\t');
      cartridge.startedOn = Date(parseInt(params[1]));
      cartridge.finishedOn = Date(parseInt(params[2]));
      do {
        cmd = data[i++].substring(0, 2);
      } while (cmd !== '99' && i < data.length);

      cartridge.result = -parseInt(data[i].split('\t')[4]) + parseInt(data[i + 1].split('\t')[4]);
      cartridge.result += parseInt(data[data.length - 3].split('\t')[4]) - parseInt(data[data.length - 2].split('\t')[4]);
      console.log(cartridge.result);
      cartridge.failed = test.percentComplete >= 100;
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
