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
  sparkcore = require('spark'),
  Q = require('q'),
  _ = require('lodash');

exports.run = function(req, res) {
  res.send();
};

var bcmds = [
  {
    num: '0',
    name: 'Start Test',
    param_count: 2,
    description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor integration time, sensor gain).'
  },
  {
    num: '1',
    name: 'Delay',
    param_count: 1,
    description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'
  },
  {
    num: '2',
    name: 'Move',
    param_count: 2,
    description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'
  },
  {
    num: '3',
    name: 'Solenoid On',
    param_count: 1,
    description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'
  },
  {
    num: '4',
    name: 'Device LED On',
    param_count: 0,
    description: 'Turns on the device LED, which is visible outside the device. No parameters.'
  },
  {
    num: '5',
    name: 'Device LED Off',
    param_count: 0,
    description: 'Turns off the device LED. No parameters.'
  },
  {
    num: '6',
    name: 'Device LED Blink',
    param_count: 2,
    description: 'Blinks the device LED at a specified rate. Parameters, (number of blinks, period in milliseconds between change in LED state).'
  },
  {
    num: '7',
    name: 'Sensor LED On',
    param_count: 1,
    description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'
  },
  {
    num: '8',
    name: 'Sensor LED Off',
    param_count: 0,
    description: 'Turns off the sensor LED. No parameters.'
  },
  {
    num: '9',
    name: 'Read Sensors',
    param_count: 2,
    description: 'Takes readings from the sensors. Parameters are (number of samples [1-10], milliseconds between samples).'
  },
  {
    num: '10',
    name: 'Read QR Code',
    param_count: 0,
    description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'
  },
  {
    num: '11',
    name: 'Disable Sensor',
    param_count: 0,
    description: 'Disables the sensors, switching them to low-power mode. No parameters.'
  },
  {
    num: '12',
    name: 'Repeat Begin',
    param_count: 1,
    description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'
  },
  {
    num: '13',
    name: 'Repeat End',
    param_count: 0,
    description: 'Ends the innermost block of repeated commands. No parameters.'
  },
  {
    num: '14',
    name: 'Status',
    param_count: 2,
    description: 'Changes the device status register, which used in remote monitoring. Parameters are (message length, message text).'
  },
  {
    num: '99',
    name: 'Finish Test',
    param_count: 0,
    description: 'Finishes the test. Required to be the final command. No parameters.'
  }
];

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
    str += _.findWhere(bcmds, {name: e.command}).num + (e.params ? ',' + e.params : '') + (i < a.length - 1 ? '\n' : '');
  });

  return str;
}

function send_BCODE_to_spark(sparkDevice, cartridgeId, bco) {
  var end, i, len, max_payload, num, packets, payload, result, start;
  var promises = [];
  var bstr = bObjectToCodeString(bco);

  max_payload = 56 - cartridgeId.length; // max string = 63 - length(command code) - length(num) - length(len) - length(cartridgeId)
  packets = Math.ceil(bstr.length / max_payload);

  promises.push(new Q(sparkDevice.callFunction(sparkDevice.id, 'runcommand', 'receive_BCODE', '000' + zeropad(packets, 2) + cartridgeId)));
  for (i = 1; i <= packets; i += 1) {
    start = (i - 1) * max_payload;
    end = start + max_payload;
    payload = bstr.substring(start, end);
    len = zeropad(payload.length, 2);
    num = zeropad(i, 3);
    promises.push(new Q(sparkDevice.callFunction(sparkDevice.id, 'runcommand', 'receive_BCODE', num + len + cartridgeId + payload)));
  }

  return promises;
}

exports.begin = function(req, res) {
  var cartridge, device, sparkDevice, sparkID, step;

  Q.fcall(function(id) {
      step = 'Device.findOneAndUpdate';
      return new Q(Device.findOneAndUpdate({
        _id: id
      }, {
        status: 'Test in progress'
      }).populate('_spark', 'sparkID').exec());
    }, req.body.device._id)
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
      step = 'Initialize device';
      console.log(step, sparkDevices);

      var sparkDevice = _.findWhere(sparkDevices, {
        id: sparkID
      });
      if (!sparkDevice.attributes.connected) {
        throw new Error(device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('runcommand', 'initialize_device'));
    })
    .then(function() {
      step = 'Create test';

      var test = new Test();
      test.user = req.user;
      test._assay = req.body.assayId;
      test._device = req.body.deviceId;
      test._cartridge = req.body.cartridgeId;
      test.name = req.body.name ? req.body.name : ('Assay ' + req.body.assayId + ' on device ' + req.body.deviceId + 'using cartridge ' + req.body.cartridgeId);
      test.description = req.body.description;
      test.status = 'Starting';
      test.percentComplete = 0;
      test.startedOn = new Date();

      return new Q(test.save());
    })
    .then(function(t) {
      step = 'Update cartridge';
      return new Q(Cartridge.findOneAndUpdate({
        _id: t._cartridge
      }, {
        _test: t._id,
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
      step = 'Send BCODE';
      console.log(step);

      var promises = send_BCODE_to_spark(sparkDevice, req.body.cartridgeId, a.BCODE);
      return promises.all();
    })
    .then(function(sparkDevices) {
      step = 'Start test';
      console.log(step, sparkDevices);

      return new Q(sparkDevice.callFunction('runcommand', 'run_test'));
    })
    .then(function(result) {
      step = 'Return response';
      res.jsonp({
        result: result
      });
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
