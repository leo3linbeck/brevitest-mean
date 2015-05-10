'use strict';

var _ = window._;

// Assays controller
angular.module('assays').controller('AssaysController', ['$scope', '$stateParams', '$location', 'Authentication', 'Assays',
  function($scope, $stateParams, $location, Authentication, Assays) {
    $scope.authentication = Authentication;

    $scope.analysis = {};
    $scope.standardCurve = [];
    $scope.BCODE = [];

    $scope.alerts = [];
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

    $scope.stdCurveSort = function() {
      $scope.standardCurve.sort(function(a, b) {return (a.x - b.x);});
    };

    $scope.stdCurveAppend = function() {
      $scope.standardCurve.push({x: 0, y: 0});
    };

    $scope.stdCurvePrepend = function() {
      $scope.standardCurve.splice(0, 0, {x: 0, y: 0});
    };

    $scope.stdCurveDelete = function(indx) {
      $scope.standardCurve.splice(indx, 1);
    };

    $scope.BCODECommands = [
      {
    		num: '0',
    		name: 'Start Test',
        param_count: 2,
    		description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor integration time, sensor gain).'
    	},
    	{
    		num: '1',
    		name: 'Delay',
        param_count: 1,
    		description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'
    	},
    	{
    		num: '2',
    		name: 'Move',
        param_count: 2,
    		description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'
    	},
    	{
    		num: '3',
    		name: 'Solenoid On',
        param_count: 1,
    		description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'
    	},
    	{
    		num: '4',
    		name: 'Device LED On',
        param_count: 0,
    		description: 'Turns on the device LED, which is visible outside the device. No parameters.'
    	},
    	{
    		num: '5',
    		name: 'Device LED Off',
        param_count: 0,
    		description: 'Turns off the device LED. No parameters.'
    	},
    	{
    		num: '6',
    		name: 'Device LED Blink',
        param_count: 2,
    		description: 'Blinks the device LED at a specified rate. Parameters, (number of blinks, period in milliseconds between change in LED state).'
    	},
    	{
    		num: '7',
    		name: 'Sensor LED On',
        param_count: 1,
    		description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'
    	},
    	{
    		num: '8',
    		name: 'Sensor LED Off',
        param_count: 0,
    		description: 'Turns off the sensor LED. No parameters.'
    	},
    	{
    		num: '9',
    		name: 'Read Sensors',
        param_count: 2,
    		description: 'Takes readings from the sensors. Parameters are (number of samples [1-10], milliseconds between samples).'
    	},
    	{
    		num: '10',
    		name: 'Read QR Code',
        param_count: 0,
    		description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'
    	},
    	{
    		num: '11',
    		name: 'Disable Sensor',
        param_count: 0,
    		description: 'Disables the sensors, switching them to low-power mode. No parameters.'
    	},
    	{
    		num: '12',
    		name: 'Repeat Begin',
        param_count: 1,
    		description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'
    	},
    	{
    		num: '13',
    		name: 'Repeat End',
        param_count: 0,
    		description: 'Ends the innermost block of repeated commands. No parameters.'
    	},
    	{
    		num: '14',
    		name: 'Status',
        param_count: 2,
    		description: 'Changes the device status register, which used in remote monitoring. Parameters are (message length, message text).'
    	},
    	{
    		num: '99',
    		name: 'Finish Test',
        param_count: 0,
    		description: 'Finishes the test. Required to be the final command. No parameters.'
    	}
    ];

    function instruction_time(code, param) {
    	var p, d = 0;

    	switch(code) {
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
    			d = Math.floor(parseInt(param[0]) * parseInt(param[1]));
    			break;
    		case 'Finish Test': // finish
    			d = 16800;
    			break;
    	}

    	return d;
    }

    function get_bcode_object(bcode) {
    	return ({ c: bcode.command, p: bcode.params.split(',') });
    }

    function calculate_BCODE_time(bcode_array) {
      var a, b, i, level, t;
    	var duration = 0;

    	for (i = 0; i < bcode_array.length; i += 1) {
    		if (bcode_array[i]) {
    			b = get_bcode_object(bcode_array[i]);
    			switch(b.c) {
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
    					} while(!(t.c === 'Repeat End' && level === 0));

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

    	if (a && a.length) {
    		duration = calculate_BCODE_time(a);
    	}

    	return (duration / 1000);
    }

    $scope.activeBCODE = 0;
    $scope.estimatedTime = 0;

    $scope.changeCommandDescription = function() {
      $scope.commandDescription = _.findWhere($scope.BCODECommands, {name: $scope.command}).description;
    };

    $scope.moveBCODETop = function() {
      $scope.BCODE.splice(0, 0, $scope.BCODE.splice($scope.activeBCODE, 1)[0]);
      $scope.activeBCODE = 0;
      $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
    };

    $scope.moveBCODEUp = function() {
      var code;

      if ($scope.activeBCODE > 0) {
        code = $scope.BCODE.splice($scope.activeBCODE, 1)[0];
        $scope.activeBCODE -= 1;
        $scope.activeBCODE = ($scope.activeBCODE < 0 ? 0 : $scope.activeBCODE);
        $scope.BCODE.splice($scope.activeBCODE, 0, code);
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.moveBCODEDown = function() {
      var code;

      if ($scope.activeBCODE < $scope.BCODE.length - 1) {
        code = $scope.BCODE.splice($scope.activeBCODE, 1)[0];
        $scope.activeBCODE += 1;
        $scope.activeBCODE = ($scope.activeBCODE > $scope.BCODE.length ? $scope.BCODE.length : $scope.activeBCODE);
        $scope.BCODE.splice($scope.activeBCODE, 0, code);
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.moveBCODEBottom = function() {
      $scope.BCODE.push($scope.BCODE.splice($scope.activeBCODE, 1)[0]);
      $scope.activeBCODE = $scope.BCODE.length - 1;
      $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
    };

    function validateCommandParams() {
      if (!$scope.command) {
        $scope.alerts.push({type: 'danger', msg: 'ERROR: No command selected'});
        return false;
      }
      var cmd = _.findWhere($scope.BCODECommands, {name: $scope.command});
      var p = $scope.params.split(',');
      if (cmd.param_count === 0 && p.length === 1 && p[0] === '') {
        return true;
      }
      if (p.length !== cmd.param_count) {
        $scope.alerts.push({type: 'danger', msg: 'ERROR: Wrong number of parameters (' + p.length + ' found and ' + cmd.param_count + ' expected)'});
        return false;
      }
      if (p.length > 0 && p[0]) {
        if (isNaN(parseInt(p[0], 10))) {
          $scope.alerts.push({type: 'danger', msg: 'ERROR: Non-numeric parameter (parameter 1 "' + p[0] + '" is not a number)'});
          return false;
        }
        $scope.params = parseInt(p[0]);
      }
      if (p.length > 1) {
        if (isNaN(parseInt(p[1], 10))) {
          $scope.alerts.push({type: 'danger', msg: 'ERROR: Non-numeric parameter (parameter 2 "' + p[1] + '" is not a number)'});
          return false;
        }
        $scope.params += ',' + parseInt(p[1]);
      }
      return true;
    }

    $scope.insertBCODETop = function() {
      if (validateCommandParams()) {
        $scope.BCODE.splice(0, 0, {command: $scope.command, params: $scope.params});
        $scope.activeBCODE = 0;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.insertBCODEAbove = function() {
      if (validateCommandParams()) {
        $scope.BCODE.splice($scope.activeBCODE, 0, {command: $scope.command, params: $scope.params});
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.insertBCODEBelow = function() {
      if (validateCommandParams()) {
        $scope.activeBCODE += 1;
        $scope.BCODE.splice($scope.activeBCODE, 0, {command: $scope.command, params: $scope.params});
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.insertBCODEBottom = function() {
      if (validateCommandParams()) {
        $scope.BCODE.push({command: $scope.command, params: $scope.params});
        $scope.activeBCODE = $scope.BCODE.length - 1;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.cutBCODE = function() {
      if ($scope.BCODE.length && $scope.activeBCODE) {
        $scope.clipboard = $scope.BCODE.splice($scope.activeBCODE, 1);
        delete $scope.clipboard._id;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.copyBCODE = function() {
      $scope.clipboard = $scope.BCODE[$scope.activeBCODE];
    };

    $scope.copyAllBCODE = function() {
      $scope.clipboard = $scope.BCODE.slice();
    };

    $scope.pasteBCODE = function() {
      $scope.activeBCODE += 1;
      if (angular.isArray($scope.clipboard)) {
        $scope.clipboard.forEach(function(e, i) {
          $scope.BCODE.splice($scope.activeBCODE + i, 0, angular.copy(e));
        });
      }
      else {
        $scope.BCODE.splice($scope.activeBCODE, 0, angular.copy($scope.clipboard));
      }
      $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
    };

    $scope.updateBCODE = function() {
      if (validateCommandParams()) {
        $scope.BCODE[$scope.activeBCODE] = {command: $scope.command, params: $scope.params};
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.deleteBCODE = function() {
      if ($scope.BCODE.length && $scope.activeBCODE) {
        $scope.BCODE.splice($scope.activeBCODE, 1);
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.deleteAllBCODE = function() {
      $scope.BCODE= [];
      $scope.estimatedTime = 0;
    };

    $scope.clickBCODECode = function(indx) {
      $scope.activeBCODE = indx;
      $scope.command = $scope.BCODE[indx].command;
      $scope.params = $scope.BCODE[indx].params;
    };

    $scope.saveBCODE = function() {
      var assay = $scope.assay;

      assay.BCODE = $scope.BCODE;
      assay.analysis = $scope.analysis;

      assay.$update(function() {
        $location.path('assays/' + assay._id + '/edit');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.revertBCODE = function() {
      $scope.findOne();
    };

    // Create new Assay
    $scope.create = function() {
      // Create new Assay object
      var assay = new Assays({
        name: this.name,
        reference: this.reference,
        description: this.description,
        url: this.url,
        analysis: this.analysis,
        standardCurve: this.standardCurve,
        BCODE: this.BCODE
      });

      // Redirect after save
      assay.$save(function(response) {
        $location.path('assays/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.reference = '';
        $scope.description = '';
        $scope.url = '';
        $scope.analysis = {};
        $scope.standardCurve = [];
        $scope.BCODE = [];
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Assay
    $scope.remove = function(assay) {
      if (assay) {
        assay.$remove();

        for (var i in $scope.assays) {
          if ($scope.assays[i] === assay) {
            $scope.assays.splice(i, 1);
          }
        }
      } else {
        $scope.assay.$remove(function() {
          $location.path('assays');
        });
      }
    };

    // Update existing Assay
    $scope.update = function() {
      var assay = $scope.assay;

      assay.BCODE = $scope.BCODE;
      assay.analysis = $scope.analysis;
      assay.standardCurve = $scope.standardCurve;

      assay.$update(function() {
        $location.path('assays/' + assay._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Assays
    $scope.find = function() {
      $scope.assays = Assays.query();
    };

    // Find existing Assay
    $scope.findOne = function() {
      $scope.assay = Assays.get({
        assayId: $stateParams.assayId
      }, function() {
        $scope.BCODE = $scope.assay.BCODE && $scope.assay.BCODE.length ? $scope.assay.BCODE : $scope.BCODE;
        if ($scope.BCODE.length) {
          $scope.activeBCODE = 0;
          $scope.command = $scope.BCODE[0].command;
          $scope.params = $scope.BCODE[0].params;
          $scope.commandDescription = _.findWhere($scope.BCODECommands, {name: $scope.command}).description;
          $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
        }
        $scope.analysis = $scope.assay.analysis;
        $scope.standardCurve = $scope.assay.standardCurve;
      });
    };
  }
]);
