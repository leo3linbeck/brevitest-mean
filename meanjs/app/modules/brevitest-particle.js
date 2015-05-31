'use strict';

// brevitest-spark.js

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Test = mongoose.model('Test'),
  Assay = mongoose.model('Assay'),
  Device = mongoose.model('Device'),
  Cartridge = mongoose.model('Cartridge'),
  Spark = mongoose.model('Spark'),
  sparkcore = require('spark'),
  Q = require('q'),
  _ = require('lodash');

var sparkDevices = [];


function getSparkDeviceList(user, forceReload) {
  var now = new Date(); // if less than 1 minute left in the token, get new one
  if (sparkDevices.length === 0 || !user.sparkAccessToken || now > user.sparkTokenExpires || forceReload) {
    return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88'
      }))
      .then(function(response) {
        if (!response.access_token) {
          throw new Error('Access token not obtained');
        }
        console.log('Access token obtained');
        user.sparkAccessToken = response.access_token;
        user.sparkTokenExpires = new Date();
        user.sparkTokenExpires.setMinutes(user.sparkTokenExpires.getMinutes() + 60);  // 1 hour
        return new Q(user.save());
      })
      .then(function() {
        console.log('Access token saved');
        return new Q(sparkcore.listDevices());
      })
      .then(function(devices) {
        console.log('Device list obtained');
        sparkDevices = devices;
        return sparkDevices;
      });
  } else {
    return new Q(sparkDevices);
  }
}

function getSparkDevice(user, sparkID, forceReload) {
  return getSparkDeviceList(user, forceReload)
    .then(function() {
      var sparkDevice = _.findWhere(sparkDevices, {
        id: sparkID
      });

      if (!sparkDevice.connected) {
        throw new Error(sparkDevice.name + ' is not online.');
      }

      return sparkDevice;
    });
}

// all exported functions return a Q promise

module.exports = {
  get_spark_device_list: function(user, forceReload) {
    return getSparkDeviceList(user, forceReload);
  },
  get_spark_device_from_testID: function(user, testID) {

  },
  get_spark_device_from_sparkID: function(user, sparkID) {

  },
  get_spark_device_from_cartridgeID: function(user, cartridgeID) {

  },
  get_spark_device_from_deviceID: function(user, deviceID) {
    return Q.fcall(function(id) {
        return new Q(Device.findById(id).populate('_spark', 'sparkID').exec());
      }, deviceID)
      .then(function(device) {
        return getSparkDevice(user, device._spark.sparkID);
      });
  },
  get_spark_device_from_test: function(user, test) {

  },
  get_spark_device_from_spark: function(user, spark) {
    return Q.fcall(function(s) {
      return getSparkDevice(user, s.sparkID);
    }, spark);
  },
  get_spark_device_from_cartridge: function(user, cartridge) {

  },
  get_spark_device_from_device: function(user, device) {
    if (typeof device._spark === 'string') { // primary key, needs to be resolved
      return Q.fcall(function(id) {
        return new Q(Spark.findById(id).exec());
      }, device._spark)
      .then(function(spark) {
        return getSparkDevice(user, spark.sparkID);
      });
    }
    else {
      return getSparkDevice(user, device._spark.sparkID);
    }
  }
};
