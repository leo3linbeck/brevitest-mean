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

function parse_bcode_data(bcode_str) {
	var data = bcode_str.split('\n');
	var result = '';

	data.forEach(function(e) {
		var c, p;
		var indx = e.indexOf(',');
		if (indx === -1) {
			c = e;
			p = '';
		}
		else {
			c = e.substring(0, indx);
			p = e.substring(indx + 1);
		}
		result += bcode[c] + (p.length ? '&nbsp;&nbsp;[&nbsp;' + p + '&nbsp;]<br/>' : '<br/>');
	});

	return result;
}

angular.module('assays').filter('bcode', [
	function() {
		return function(input) {
      // bcode directive logic
      // ...
      var out;

			if (angular.isString(input)) {
				input = input || '';
				out = parse_bcode_data(input);
      }

      return out;
    };
	}
]);
