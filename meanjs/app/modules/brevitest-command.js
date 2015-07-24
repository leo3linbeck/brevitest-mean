'use strict';

// brevitest-command.js
var particle = require('spark');

var command_code = {
    'run_test': '01',
    'cancel_test': '02',
    'claim_device': '03',
    'release_device': '04',

    'send_next_packet': '10',

    'start_end_assay': '20',
    'start_send_test': '21',

    'write_serial_number': '30',
    'change_param': '31',
    'reset_params': '32',
    'get_firmware_version': '33',
    'set_calibration_point': '34',

    'move_stage': '50',
    'energize_solenoid': '51',
    'turn_on_device_LED': '52',
    'turn_off_device_LED': '53',
    'blink_device_LED': '54',
    'read_qr_code': '55',
    'verify_qr_code': '56'
};

module.exports = {
    'run_test': function() {

    },
    'cancel_test': function() {

    },
    'claim_device': function() {

    },
    'release_device': function() {

    },
    'send_next_packet': function() {

    },
    'start_end_assay': function() {

    },
    'start_send_test': function() {

    },
    'write_serial_number': function() {

    },
    'change_param': function() {

    },
    'reset_params': function() {

    },
    'get_firmware_version': function() {

    },
    'set_calibration_point': function(number_of_steps) {
        return particle.callFunction('runcommand', command_code.calibrate + number_of_steps);
    },
    'move_stage': function() {

    },
    'energize_solenoid': function() {

    },
    'turn_on_device_LED': function() {

    },
    'turn_off_device_LED': function() {

    },
    'blink_device_LED': function() {

    },
    'read_qr_code': function() {

    },
    'verify_qr_code': function() {

    }
};
