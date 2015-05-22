'use strict';

// brevitest-command.js

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
      d = 5000;
      break;
    case 'Start Test': // finish
      d = 6000;
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

module.exports = {
  BCODE: [{
    num: '0',
    name: 'Start Test',
    param_count: 2,
    description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor gain code<<8+sensor integration time code, sensor LED power).'
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
    param_count: 0,
    description: 'Takes readings from the sensors. No parameters.'
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
  }],

  calculate_duration: get_BCODE_duration
};
