'use strict';

var sparkSensorHeader = 'Sensor\t    Type\t            Reading Start       \t          Value\n\n';

function string_to_datetime(str) {
	return new Date(parseInt(str) * 1000);
}

function string_to_datetime_string(str) {
	return string_to_datetime(str).toUTCString();
}

function parse_sensor_reading(str) {
	var data = str.split('\t');
	var result = (data[0] === 'A' ? 'Assay' : 'Control') + '\t';
	result += (parseInt(data[1]) ? 'Result' : 'Baseline') + '\t';
  result += string_to_datetime_string(data[2]) + '\t';
	result += data[3] + '\n';
	return result;
}

function parse_test_header(str) {
	var data = str.split('\t');
	var result = 'TEST INFORMATION\n';
	result += 'Record number: ' + data[0] + '\n';
	result += 'Test start time: ' + string_to_datetime_string(data[1]) + '\n';
	result += 'Test finish time: ' + string_to_datetime_string(data[2]) + '\n';
	result += 'Cartridge ID: ' + data[3] + '\n';
	result += 'BCODE version: ' + data[4] + '\n';
	result += 'BCODE length: ' + data[5] + '\n';
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

function parse_test_data(test_str) {
	var attr, i, i2, num_samples;
	var data = test_str.split('\n');
	var result = parse_test_header(data[0]);

	result += parse_test_params(data[1]);

	result += '\nSENSOR READINGS\n';
	result += sparkSensorHeader;
	for (i = 2; i < 6; i += 1) {
		result += parse_sensor_reading(data[i]);
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
