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

var devicePopulate = [{
  path: 'user',
  select: 'displayName'
}, {
  path: '_devicePool',
  select: '_id name'
}, {
  path: '_deviceModel',
  select: '_id name'
}];

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
        exec: function(particle_device, assayID) {
            return particle_device.callFunction('requestdata', this.code + assayID);
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
    },
    'assay_uuids': {
        code: '07',
        exec: function(particle_device) {
            return particle_device.callFunction('requestdata', this.code);
        }
    },
    'test_uuids': {
        code: '08',
        exec: function(particle_device) {
            return particle_device.callFunction('requestdata', this.code);
        }
    }
};

var command = {
    'run_test': {
        code: '01',
        exec: function(particle_device, testID) {
            console.log('Running test: ', testID);
            return particle_device.callFunction('runcommand', this.code + testID);
        }
    },
    'cancel_test': {
        code: '02',
        exec: function(particle_device, testID) {
            console.log('Cancelling test: ', testID);
            return particle_device.callFunction('runcommand', this.code + testID);
        }
    },
    'claim_device': {
        code: '03',
        exec: function(particle_device, userID) {
            console.log('Claiming device: ', userID);
            return particle_device.callFunction('runcommand', this.code + userID);
        }
    },
    'release_device': {
        code: '04',
        exec: function(particle_device, userID) {
            console.log('Releasing device: ', userID);
            return particle_device.callFunction('runcommand', this.code + userID);
        }
    },
    'send_first_packet': {
        code: '10',
        exec: function(particle_device, message_id, message_type, message_size, number_of_packets) {
            var data = this.code + '0007' + message_id + zeropad(message_type, 2) + zeropad(message_size, 3) + zeropad(number_of_packets, 2);
            console.log('send_first_packet', data);
            return particle_device.callFunction('runcommand', data);
        }
    },
    'send_next_packet': {
        code: '11',
        exec: function(particle_device, arg) {
            console.log('send_next_packet', arg);
            return particle_device.callFunction('runcommand', this.code + arg);
        }
    },
    'check_assay_cache': {
        code: '20',
        exec: function(particle_device, uuid) {
            console.log('check_assay_cache', uuid);
            return particle_device.callFunction('runcommand', this.code + uuid);
        }
    },
    'check_test_cache': {
        code: '21',
        exec: function(particle_device, uuid) {
            console.log('check_test_cache', uuid);
            return particle_device.callFunction('runcommand', this.code + uuid);
        }
    },
    'write_serial_number': {
        code: '30',
        exec: function(particle_device, serial_number) {
            return particle_device.callFunction('runcommand', this.code + serial_number);
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
        exec: function(particle_device) {
            return particle_device.callFunction('runcommand', this.code);
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
        exec: function(particle_device, uuid) {
            console.log('verify_qr_code', uuid);
            return particle_device.callFunction('runcommand', this.code + uuid);
        }
    },
    'battery_level': {
        code: '66',
        exec: function(particle_device) {
            console.log('battery_level');
            return particle_device.callFunction('runcommand', this.code);
        }
    }
};

// particle functions
function particle_login_promise(user) {
    var now = new Date();
    if (!user.particleAccessToken || now > user.particleTokenExpires) {
        console.log('Logging in with username and password');
        return new Q(particle.login({
                    username: 'particle@brevitest.com',
                    password: 'FbM-c9p-SGJ-LN8'
            })
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
            }));
    }
    else {
        console.log('Logging in with access token');
        return new Q(particle.login({accessToken: user.particleAccessToken}));
    }
}

var timeout = new Date();

function getParticleList(user) {
    return particle_login_promise(user)
        .then(function() {
            return new Q(particle.listDevices());
        });
}

function getParticleDevice(user, particleID) {
    return getParticleList(user)
        .then(function(particleList) {
            var particleDevice = _.findWhere(particleList, {
                id: particleID
            });
            if (!particleDevice) {
                throw new Error('Particle ' + particleID + ' not found');
            }
            if (!particleDevice.connected) {
                throw new Error(particleDevice.name + ' is not online.');
            }
            return particleDevice;
        });
}

// send data functions

function convert_assay_to_string(assay) {
    var str = assay.id;
    var bcodeStr = bObjectToCodeString(assay.BCODE);

    str += zeropad(assay.name.length, 2);
    str += (assay.name + new Array(63).join(' ')).substring(0, 63);
    str += zeropad(bt.calculate_duration(assay.BCODE), 5);
    str += zeropad(bcodeStr.length, 3);
    str += '000'; // placeholder for BCODE version
    str += bcodeStr;
    console.log('Assay string', str);
    return str;
}

function send_message_to_particle(particle_device, str, message_type, message_id, firstCommand) {
    var i, payload, start;
    var args = [];
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
    }, new Q(command.send_first_packet.exec(particle_device, message_id, message_type, str.length, packet_count)));
}

// exported functions - all functions return a Q promise

module.exports = {
    get_particle_list: function(user) {
        return getParticleList(user);
    },
    get_particle_device_from_uuid: function(user, uuid) {
        return new Q(Device.findById(uuid).exec())
            .then(function(device) {
                return [device, getParticleDevice(user, device.particleID)];
            });
    },
    get_particle_device: function(user, device) {
        return getParticleDevice(user, device.particleID);
    },
    get_register_contents: function(particle_device) {
        return particle_device.getVariable('register')
            .then(function(result) {
                return result.result;
            });
    },
    get_power_status: function(particle_device) {
        return particle_device.getVariable('powerstatus')
            .then(function(result) {
                return result.result;
            });
    },
    execute_particle_command: function(particle_device, cmd, arg1, arg2, arg3) {
        return new Q(command[cmd].exec(particle_device, arg1 || null, arg2 || null, arg3 || null))
            .then(function(result) {
                console.log('Checking result: ', result.return_value);
                if (result.return_value < 0) {
                    throw new Error('Error ' + result.return_value + ' detected in command ' + cmd + '(' + arg1 + ', ' + arg2 + ', ' + arg3 + ')');
                }
                return result;
            });
    },
    execute_particle_request: function(particle_device, req, arg1, arg2, arg3) {
        return new Q(request[req].exec(particle_device, arg1, arg2, arg3))
            .then(function(result) {
                if (result.return_value < 0) {
                    throw new Error('Error ' + result.return_value + ' detected in request ' + req + '(' + arg1 + ', ' + arg2 + ', ' + arg3 + ')');
                }
                return particle_device.getVariable('register');
            })
            .then(function(result) {
                return result.result;
            });
    },
    send_assay_to_particle: function(particle_device, assay) {
        var str = convert_assay_to_string(assay);
        var message_id = assay.id.substr(18);
        return send_message_to_particle(particle_device, str, '01', message_id, 'start_send_assay');
    },
    send_test_to_particle: function(particle_device, test) {
        var str = test.user + test._id + test._assay + test._cartridge;
        var message_id = test._id.toString().substr(18);
        return send_message_to_particle(particle_device, str, '02', message_id, 'start_send_test');
    },
    get_BCODE_string: function(bcode_obj) {
        return bObjectToCodeString(bcode_obj);
    },
    start_monitor: function(particle_device, subscribeID, callback) {
        particle_device.subscribe(subscribeID, callback);
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
    },
    available_devices: function(user) {
        return new Q(Device.find({_devicePool: user._devicePool}).populate(devicePopulate).exec())
          .then(function(devices) {
              return [devices, particle_login_promise(user)];
          })
          .spread(function(devices, loginResult) {
            return [devices, getParticleList(user)];
          })
          .spread(function(devices, particle_devices) {
              var available = [];

              particle_devices.forEach(function(e) {
                  var device = _.findWhere(devices, {particleID: e.id});
                  if (device) {
                      device.connected = e.connected;
                      device.lastHeard = e.lastHeard;
                      device.lastIpAddress = e.lastIpAddress;
                      device.save();
                      if (device.connected && !device.claimed) {
                          available.push(device);
                      }
                  }
              });
              return available;
          });
    }
};
