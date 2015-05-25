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
  var now = new Date() - 60000; // if less than 1 minute left in the token, get new one
  if (sparkDevices.length === 0 || !user.sparkAccessToken || now > user.sparkTokenExpires || forceReload) {
    return new Q(sparkcore.login({
        username: 'leo3@linbeck.com',
        password: '2january88',
        expires_in: 3600 // 10 hours
      }))
      .then(function(response) {
        if (!response.access_token) {
          throw new Error('Access token not obtained');
        }
        user.sparkAccessToken = response.access_token;
        user.sparkTokenExpires = new Date() + response.expires_in * 1000;
        new Q(user.save())
          .then(function() {
            console.log('User sparkAccessToken updated');
          })
          .fail(function(err) {
            console.log('Error saving user sparkAccessToken', err);
          })
          .done();
      })
      .then(function() {
        return new Q(sparkcore.listDevices());
      })
      .then(function(devices) {
        sparkDevices = devices;
        return devices;
      });
  } else {
    return new Q.fcall(function(sd) {return sd;}, sparkDevices);
  }
}

function getSparkDevice(user, sparkID, forceReload) {
  return getSparkDeviceList(user, forceReload)
    .then(function(sparkDevices) {
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
        return new Q(Device.findById(id).populate('_spark', 'sparkID token tokenExpires').exec());
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
