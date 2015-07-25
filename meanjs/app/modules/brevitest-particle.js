'use strict';

// brevitest-particle.js

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  particle = require('spark'),
  fs = require('fs'),
  Q = require('q'),
  _ = require('lodash');

var bt = require('../../app/modules/brevitest-BCODE');
var bcmds = bt.BCODE;
var get_BCODE_duration = bt.calculate_duration;

var particles = [];

// utility functions

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

// firmware definitions

var request = {
  'serial_number': {
    code: '01',
    exec: function() {

    }
  },
  'test_record': {
    code: '02',
    exec: function(particle_device, testID) {
      return particle_device.callFunction('requestdata', this.code + testID);
    }
  },
  'assay_record': {
    code: '03',
    exec: function() {

    }
  },
  'all_params': {
    code: '04',
    exec: function() {

    }
  },
  'one_param': {
    code: '05',
    exec: function() {

    }
  },
  'qr_code': {
    code: '06',
    exec: function() {

    }
  }
};

var command =  {
  'run_test': {
    code: '01',
    exec: function() {

    }
  },
  'cancel_test': {
    code: '02',
    exec: function() {

    }
  },
  'claim_device': {
    code: '03',
    exec: function(particle_device, userID) {
      return particle_device.callFunction('runcommand', this.code + userID);
    }
  },
  'release_device': {
    code: '04',
    exec: function() {

    }
  },
  'send_next_packet': {
    code: '10',
    exec: function(particle_device, arg) {
      return particle_device.callFunction('runcommand', this.code + arg);
    }
  },
  'start_send_assay': {
    code: '20',
    exec: function(particle_device, message_id, number_of_packets, message_size) {
      return particle_device.callFunction('runcommand', this.code + '0005' + message_id + zeropad(number_of_packets, 2) + zeropad(message_size, 3));
    }
  },
  'start_send_test': {
    code: '21',
    exec: function() {

    }
  },
  'write_serial_number': {
    code: '30',
    exec: function() {

    }
  },
  'change_param': {
    code: '31',
    exec: function() {

    }
  },
  'reset_params': {
    code: '32',
    exec: function() {

    }
  },
  'get_firmware_version': {
    code: '33',
    exec: function() {

    }
  },
  'set_calibration_point': {
    code: '34',
    exec: function(particle_device, number_of_steps) {
      return particle_device.callFunction('runcommand', this.code + number_of_steps);
    }
  },
  'move_stage': {
    code: '50',
    exec: function() {

    }
  },
  'energize_solenoid': {
    code: '51',
    exec: function() {

    }
  },
  'turn_on_device_LED': {
    code: '52',
    exec: function() {

    }
  },
  'turn_off_device_LED': {
    code: '53',
    exec: function() {

    }
  },
  'blink_device_LED': {
    code: '54',
    exec: function() {

    }
  },
  'read_qr_code': {
    code: '55',
    exec: function() {

    }
  },
  'verify_qr_code': {
    code: '56',
    exec: function() {

    }
  }
};

// particle functions
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

// send data functions

function convert_assay_to_string(assay) {
  var str = assay.id;

  str += assay.name + '\0';
  str += zeropad(bt.calculate_duration(assay.BCODE), 6);
  str += zeropad(assay.BCODE.length, 3);
  str += '000'; // placeholder for BCODE version
  str += bObjectToCodeString(assay.BCODE);

  return str;
}

// exported functions - all functions return a Q promise

module.exports = {
  get_particle_list: function(user, forceReload) {
    return getParticleList(user, forceReload);
  },
  get_particle_device_from_uuid: function(user, uuid) {
    return Q.fcall(function(id) {
        return new Q(Device.findById(id).exec());
      }, uuid)
      .then(function(device) {
        return getParticle(user, device.particleID);
      });
  },
  get_particle_device: function(user, device) {
    return getParticle(user, device.particleID);
  },
  execute_particle_command: function(device, cmd, arg1, arg2, arg3) {
    return new Q(command[cmd].exec(device, arg1, arg2, arg3))
      .then(function(result) {
        if (result.return_value < 0) {
          throw new Error('Error ' + result.return_value + ' detected in command ' + cmd + '(' + arg1 + ', ' + arg2 + ', ' + arg3 +')');
        }
        return result;
      });
  },
  execute_particle_request: function(device, req, arg1, arg2, arg3) {
    return new Q(request[req].exec(device, arg1, arg2, arg3))
      .then(function(result) {
        if (result.return_value < 0) {
          throw new Error('Error ' + result.return_value + ' detected in request ' + req + '(' + arg1 + ', ' + arg2 + ', ' + arg3 +')');
        }
        return particle.getVariable('register');
      });
  },
  send_assay_to_particle: function(particle_device, assay) {
    var str = convert_assay_to_string(assay);
    var i, payload, start;
    var args = [];
    var message_id = assay.id.substring(0, 6);
    var max_payload = 51; // max string = 63 - length(command code)[2] - length(packet_number)[2] - length(packet_length)[2] - length(message_id)[6]
    var packet_count = Math.ceil(str.length / max_payload);

    for (i = 1; i <= packet_count; i += 1) {
      start = (i - 1) * max_payload;
      payload = str.substring(start, start + max_payload);
      args.push(zeropad(i, 2) + zeropad(payload.length, 2) + message_id + payload);
    }

    return args.reduce(function(soFar, arg) {
      return soFar.then(function() {
        return command.send_next_packet.exec(particle_device, arg);
      });
    }, new Q(command.start_send_assay.exec(particle_device, message_id, packet_count, str.length)));
  },
  reflash: function(device) {
    var files = fs.readdirSync('app/firmware');

    if (!files || !files.length) {
      throw new Error('Firmware folder not found or empty');
    }
    var firmware = [];
    files.forEach(function(f) {
      if (f.substring(0, 15) === 'photon_firmware' && f.substring(f.length - 4) === '.bin') {
        firmware.push(f);
      }
    });
    if (firmware.length !== 1) {
      throw new Error('Firmware folder must have exactly one firmware file');
    }
    return new Q(device.flash('app/firmware/' + firmware[0]));
  }
};
