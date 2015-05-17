'use strict';

var bcode = {
  '0': 'Start Test',
  '1': 'Delay',
  '2': 'Move',
  '3': 'Solenoid On',
  '4': 'Device LED On',
  '5': 'Device LED Off',
  '6': 'Device LED Blink',
  '7': 'Sensor LED On',
  '8': 'Sensor LED Off',
  '9': 'Read Sensors',
  '10': 'Read QR Code',
  '11': 'Disable Sensor',
  '12': 'Repeat Begin',
  '13': 'Repeat End',
  '14': 'Status',
  '99': 'Finish Test'
};

var sparkSensorHeader = 'S\t n\t       sensor read time       \t  C  \t  R  \t  G  \t  B\n\n';

function string_to_datetime(str) {
	return new Date(parseInt(str) * 1000);
}

function string_to_datetime_string(str) {
	return string_to_datetime(str).toUTCString();
}

function parse_sensor_reading(str) {
	var data = str.split('\t');
	var result = (data[0] === 'A' ? 'Assay' : 'Control') + '\t';
	result += data[1] + '\t';
	result += string_to_datetime_string(data[2]) + '\t';
	result += data[3] + '\t';
	result += data[4] + '\t';
	result += data[5] + '\t';
	result += data[6] + '\n';
	return result;
}

function parse_test_header(str) {
	var data = str.split('\t');
	var result = 'TEST INFORMATION\n';
	result += 'Record number: ' + data[0] + '\n';
	result += 'Test start time: ' + string_to_datetime_string(data[1]) + '\n';
	result += 'Test finish time: ' + string_to_datetime_string(data[2]) + '\n';
	result += 'Cartridge ID: ' + data[3] + '\n';
	result += 'Number of sensor samples: ' + data[4] + '\n';
	result += 'BCODE version: ' + data[5] + '\n';
	result += 'BCODE length: ' + data[6] + '\n';
	result += '\n';
	return result;
}

function parse_test_params(str) {
	var data = str.split('\t');
	var result = 'DEVICE PARAMETERS\n';
	result += 'step_delay_us: ' + data[0] + '\n';
	result += 'stepper_wifi_ping_rate: ' + data[1] + '\n';
	result += 'stepper_wake_delay_ms: ' + data[2] + '\n';
	result += 'solenoid_surge_power: ' + data[3] + '\n';
	result += 'solenoid_surge_period_ms: ' + data[4] + '\n';
	result += 'solenoid_sustain_power: ' + data[5] + '\n';
	result += 'sensor_params: ' + parseInt(data[6], 16).toString() + '\n';
	result += 'sensor_ms_between_samples: ' + data[7] + '\n';
	result += 'sensor_led_power: ' + data[8] + '\n';
	result += 'sensor_led_warmup_ms: ' + data[9] + '\n';
	result += '\n';
	return result;
}

function convert_BCODE_string(str) {
	var c, cmd, i, indx, p;
	var a = '';

	if (str) {
		cmd = str.split('\n');

		for (i = 0; i < cmd.length; i += 1) {
			if (cmd[i]) {
				indx = cmd[i].indexOf(',');
				if (indx === -1) {
					c = cmd[i];
					p = '';
				}
				else {
					c = cmd[i].substr(0, indx);
					p = cmd[i].substr(indx + 1);
				}
				c = bcode[c];
				a += c + new Array(14 - c.length).join(' ') + '\t' + p + '\n';
			}
		}
	}

	return a;
}
function parse_test_data(test_str) {
	var attr, i, i2, num_samples;
	var data = test_str.split('\n');
	var result = parse_test_header(data[0]);

	result += parse_test_params(data[1]);

	result += 'BCODE COMMANDS\n';
	i = 1;
	do {
		i += 1;
		result += convert_BCODE_string(data[i]);
	} while (data[i].substr(0, 2) !== '99') ;

	result += '\nSENSOR READINGS\n';
	result += sparkSensorHeader;
	num_samples = parseInt(test_str.substr(61, 3));
	i2 = i + 1;
	for (i = 0; i < (2 * num_samples); i += 1) {
		result += parse_sensor_reading(data[i2 + i]);
	}

	return result;
}

angular.module('sparks').filter('rawtestdata', [
	function() {
		return function(input) {
      // rawtestdata directive logic
      // ...
      var out;

			if (angular.isString(input)) {
				input = input || '';
				out = parse_test_data(input);
      }

      return out;
    };
	}
]);
