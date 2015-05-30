'use strict';

var sparkSensorHeader = '<tr><th>Sensor</th><th>Type</th><th>Reading Date<br/>Reading Time</th><th>Value</th></tr>';

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

function string_to_datetime_string(str) {
	var dt = string_to_datetime(str);
	return dt.toLocaleDateString() + '<br/>' + dt.toLocaleTimeString();
}

function parse_sensor_reading(str) {
	var data = str.split('\t');
	var result = '<tr><td>' + (data[0] === 'A' ? 'Assay' : 'Control') + '</td>';
	result += '<td>' + (parseInt(data[1], 10) ? 'Result' : 'Baseline') + '</td>';
  result += '<td>' + string_to_datetime_string(data[2]) + '</td>';
	result += '<td>' + data[3] + '<td/></tr>';
	return result;
}

function parse_test_header(str) {
	var data = str.split('\t');
	var result = '<strong>TEST INFORMATION</strong><br/>';
	result += 'Record number: ' + data[0] + '<br/>';
	result += 'Test start time: ' + string_to_datetime_string(data[1]) + '<br/>';
	result += 'Test finish time: ' + string_to_datetime_string(data[2]) + '<br/>';
	result += 'Cartridge ID: ' + data[3] + '<br/>';
	result += 'BCODE version: ' + data[4] + '<br/>';
	result += 'BCODE length: ' + data[5] + '<br/>';
	result += 'Integration time: ' + int_time[parseInt(data[6], 10)] + '<br/>';
	result += 'Gain: ' + gain[parseInt(data[7], 10)] + '<br/>';
	result += '<br/>';
	return result;
}

function parse_test_params(str) {
	var data = str.split('\t');
	var result = '<strong>DEVICE PARAMETERS</strong><br/>';
	result += 'step_delay_us: ' + data[0] + '<br/>';
	result += 'stepper_wifi_ping_rate: ' + data[1] + '<br/>';
	result += 'stepper_wake_delay_ms: ' + data[2] + '<br/>';
	result += 'solenoid_surge_power: ' + data[3] + '<br/>';
	result += 'solenoid_surge_period_ms: ' + data[4] + '<br/>';
	result += 'solenoid_sustain_power: ' + data[5] + '<br/>';
	result += 'sensor_params: ' + parseInt(data[6], 16).toString() + '<br/>';
	result += 'sensor_ms_between_samples: ' + data[7] + '<br/>';
	result += 'sensor_led_power: ' + data[8] + '<br/>';
	result += 'sensor_led_warmup_ms: ' + data[9] + '<br/>';
	result += '<br/>';
	return result;
}

function parse_test_data(test_str) {
	var attr, i, i2, num_samples;
	var data = test_str.split('\n');
	var result = parse_test_header(data[0]);

	result += parse_test_params(data[1]);

	result += '<br/><strong>SENSOR READINGS</strong><br/>';
	result += '<table class="table table-striped">' + sparkSensorHeader;
	for (i = 2; i < 6; i += 1) {
		result += parse_sensor_reading(data[i]);
	}
	result += '</table>';

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
