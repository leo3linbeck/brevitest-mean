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
  Q = require('q');

/**
 * Refresh Spark data
 */

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

exports.erase_archived_data = function(req, res) {
    console.log('Erase archived data', req.body.spark);

    Q.fcall(function(auth) {
        return new Q(sparkcore.login(auth));
        }, {
          username: 'leo3@linbeck.com',
          password: '2january88'
        })
      .then(function(token) {
        return new Q(sparkcore.listDevices());
      })
      .then(function(devices) {
        console.log('Erasing data', devices);

        var sparkDevice = _.findWhere(devices, {id: req.body.spark.sparkID});
        console.log(sparkDevice);
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

    Q.fcall(function(auth) {
        return new Q(sparkcore.login(auth));
        }, {
          username: 'leo3@linbeck.com',
          password: '2january88'
        })
      .then(function(token) {
        return new Q(sparkcore.listDevices());
      })
      .then(function(devices) {
        console.log('Retrieving archive size', devices);

        var sparkDevice = _.findWhere(devices, {id: req.body.spark.sparkID});
        console.log(sparkDevice);
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

var readResult;

function requestAndReadRegister(res, id, sparkDevice, requestIndex, requestCode, requestParam) {
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
      requestAndReadRegister(res, id, sparkDevice, index, requestCode, requestParam);
    }
  })
  .then(function(result) {
    console.log('Result', result);
    if (result) {
      if (result.return_value === -1) {
        res.jsonp(readResult);
      }
      else {
        throw new Error('Request to retrieve first record failed');
      }
    }
  })
  .fail(
    function(err) {
      console.log('Register retrieval failed', err);
    })
  .done();
}

exports.get_record_by_cartridge_id = function(req, res) {
  console.log('Retrieving record by cartridge number', req.body.spark, req.body.cartridgeID);

  var sparkID;
  var cartridgeID = req.body.cartridgeID;
  readResult = '';

  Q.fcall(function() {
      return new Q(Cartridge.findById(cartridgeID).exec());
    })
    .then(function(cartridge) {
      return new Q(Device.findById(cartridge._device).populate('_spark', 'sparkID').exec());
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
      return requestAndReadRegister(res, cartridgeID, sparkDevice, 0, brevitestRequest.test_record_by_uuid);
    })
    .fail(
      function(err) {
        console.log('Record retrieval failed', err);
      })
    .done();
};

exports.get_record_by_index = function(req, res) {
    console.log('Retrieving record by number', req.body.spark, req.body.index);
    readResult = '';

    Q.fcall(function(auth) {
        return new Q(sparkcore.login(auth));
        }, {
          username: 'leo3@linbeck.com',
          password: '2january88'
        })
      .then(function(token) {
        return new Q(sparkcore.listDevices());
      })
      .then(function(devices) {
        console.log('Spark devices', devices);

        var sparkDevice = _.findWhere(devices, {id: req.body.spark.sparkID});
        console.log(sparkDevice);
        return requestAndReadRegister(res, sparkDevice.id, sparkDevice, 0, brevitestRequest.test_record, req.body.index);
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

    Q.fcall(function(auth) {
        return new Q(sparkcore.login(auth));
        }, {
          username: 'leo3@linbeck.com',
          password: '2january88'
        })
      .then(function(token) {
        return new Q(sparkcore.listDevices());
      })
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
