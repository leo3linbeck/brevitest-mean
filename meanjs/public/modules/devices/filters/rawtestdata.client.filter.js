'use strict';

var particleSensorHeader = '<thead><tr><th>Sensor</th><th>Type</th><th>Reading Date<br/>Reading Time</th><th>Red</th><th>Green</th><th>Blue</th></tr></thead><tbody>';

var int_time = {
	0: '700ms',
	192: '154ms',
	213: '101ms',
	235: '50ms',
	246: '24ms',
	255: '2.4ms'
};
var gain = {
	0: '1X',
	1: '4X',
	2: '16X',
	3: '64X'
};

function string_to_datetime(str) {
	return new Date(parseInt(str) * 1000);
}

function string_to_datetime_string(str, delim) {
	var dt = string_to_datetime(str);
	return dt.toLocaleDateString() + (delim ? delim :'<br/>') + dt.toLocaleTimeString();
}

function parse_sensor_reading(str, assayorcontrol, baselineortest) {
	var data = str.split('\t');
	var result = '<tr><td>' + assayorcontrol + '<td>' + baselineortest;
  result += '<td>' + string_to_datetime_string(data[0]);
	result += '<td>' + parseInt(data[1], 10);
	result += '<td>' + parseInt(data[2], 10);
	result += '<td>' + parseInt(data[3], 10) + '</tr>';
	return result;
}

function parse_test_header(str) {
	var data = str.split('\t');
	var result = '<strong>TEST INFORMATION</strong><br/>';
	result += 'Test start time: ' + string_to_datetime_string(data[0], ' - ') + '<br/>';
	result += 'Test finish time: ' + string_to_datetime_string(data[1], ' - ') + '<br/>';
	result += 'Test ID: ' + data[2] + '<br/>';
	result += 'Cartridge ID: ' + data[3] + '<br/>';
	result += 'Assay ID: ' + data[4] + '<br/>';
	result += '<br/>';
	return result;
}

function parse_test_params(str) {
	var data = str.split('\t');
	var result = '<strong>DEVICE PARAMETERS</strong><br/>';
	result += 'reset_steps: ' + data[0] + '<br/>';
	result += 'step_delay_us: ' + data[1] + '<br/>';
	result += 'publish_interval_during_move: ' + data[2] + '<br/>';
	result += 'stepper_wake_delay_ms: ' + data[3] + '<br/>';
	result += 'solenoid_surge_power: ' + data[4] + '<br/>';
	result += 'solenoid_sustain_power: ' + data[5] + '<br/>';
	result += 'solenoid_surge_period_ms: ' + data[6] + '<br/>';
	result += 'delay_between_sensor_readings_ms: ' + data[7] + '<br/>';
	result += 'integration_time: ' + int_time[parseInt(data[8], 10)] + '<br/>';
	result += 'gain: ' + gain[parseInt(data[9], 10)] + '<br/>';
	result += 'calibration_steps: ' + data[10] + '<br/>';
	result += '<br/>';
	return result;
}

function parse_test_data(test_str) {
	var attr, i, i2, num_samples;
	var data = test_str.split('\n');
	var result = parse_test_header(data[0]);

	result += parse_test_params(data[1]);

	result += '<br/><strong>SENSOR READINGS</strong><br/>';
	result += '<div class="table-responsive"><table class="table table-striped">' + particleSensorHeader;
	result += parse_sensor_reading(data[2], 'Baseline', 'Assay');
	result += parse_sensor_reading(data[3], 'Baseline', 'Control');
	result += parse_sensor_reading(data[4], 'Test', 'Assay');
	result += parse_sensor_reading(data[5], 'Test', 'Control');

	result += '</tbody></table></div>';

	return result;
}

angular.module('devices').filter('rawtestdata', [
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
