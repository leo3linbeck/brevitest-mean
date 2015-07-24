'use strict';

// brevitest-particle.js

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  particle = require('spark'),
  Q = require('q'),
  _ = require('lodash');

var particles = [];


function getParticleList(user, forceReload) {
  var now = new Date(); // if less than 1 minute left in the token, get new one
  if (particles.length === 0 || !user.particleAccessToken || now > user.particleTokenExpires || forceReload) {
    return new Q(particle.login({
        username: 'particle@brevitest.com',
        password: 'FbM-c9p-SGJ-LN8'
      }))
      .then(function(response) {
        if (!response.access_token) {
          throw new Error('Access token not obtained');
        }
        console.log('Access token obtained');
        user.particleAccessToken = response.access_token;
        user.particleTokenExpires = new Date();
        user.particleTokenExpires.setMinutes(user.particleTokenExpires.getMinutes() + 60); // 1 hour
        return new Q(user.save());
      })
      .then(function() {
        console.log('Access token saved');
        return new Q(particle.listDevices());
      })
      .then(function(devices) {
        console.log('Device list obtained');
        particles = devices;
        return particles;
      });
  } else {
    return new Q(particles);
  }
}

function getParticle(user, particleID, forceReload) {
  return getParticleList(user, forceReload)
    .then(function() {
      var p = _.findWhere(particles, {
        id: particleID
      });

      if (!p.connected) {
        throw new Error(p.name + ' is not online.');
      }

      return p;
    });
}

// all exported functions return a Q promise

module.exports = {
  get_particle_list: function(user, forceReload) {
    return getParticleList(user, forceReload);
  },
  get_particle_from_deviceID: function(user, deviceID) {
    return Q.fcall(function(id) {
        return new Q(Device.findById(id).exec());
      }, deviceID)
      .then(function(device) {
        return getParticle(user, device.particleID);
      });
  },
  get_particle_from_device: function(user, device) {
    return getParticle(user, device.particleID);
  }
};
