'use strict';

var _ = window._;

// Assays controller
angular.module('assays').controller('AssaysController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Assays', 'Notification',
  function($scope, $http, $stateParams, $location, Authentication, Assays, Notification) {
    $scope.authentication = Authentication;

    $scope.analysis = {};
    $scope.standardCurve = [];
    var initialBCODE = [{
      command: 'Start Test',
      params: '0,0'
    }, {
      command: 'Read Sensors',
      params: ''
    }, {
      command: 'Finish Test',
      params: ''
    }];
    $scope.BCODE = angular.copy(initialBCODE);

    $scope.cartridgeInventory = 0;

    $scope.recalcInventory = function() {
      $http.get('/cartridges/get_inventory/' + $scope.assay._id).
      success(function(data, status, headers, config) {
        $scope.cartridgeInventory = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.make10Cartridges = function() {
      console.log('Making 10 cartridges');
      $http.post('/assays/make10cartridges', {
        assay: $scope.assay
      }).
      success(function(data, status, headers, config) {
        $scope.cartridgeInventory = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.stdCurveSort = function() {
      $scope.standardCurve.sort(function(a, b) {
        return (a.x - b.x);
      });
    };

    $scope.stdCurveAppend = function() {
      $scope.standardCurve.push({
        x: 0,
        y: 0
      });
    };

    $scope.stdCurvePrepend = function() {
      $scope.standardCurve.splice(0, 0, {
        x: 0,
        y: 0
      });
    };

    $scope.stdCurveDelete = function(indx) {
      $scope.standardCurve.splice(indx, 1);
    };

    $scope.BCODECommands = [{
      num: '0',
      name: 'Start Test',
      param_count: 2,
      canMove: false,
      canDelete: false,
      canInsert: false,
      description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor integration time, sensor gain).'
    }, {
      num: '1',
      name: 'Delay',
      param_count: 1,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'
    }, {
      num: '2',
      name: 'Move',
      param_count: 2,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'
    }, {
      num: '3',
      name: 'Solenoid On',
      param_count: 1,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'
    }, {
      num: '4',
      name: 'Device LED On',
      param_count: 0,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Turns on the device LED, which is visible outside the device. No parameters.'
    }, {
      num: '5',
      name: 'Device LED Off',
      param_count: 0,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Turns off the device LED. No parameters.'
    }, {
      num: '6',
      name: 'Device LED Blink',
      param_count: 2,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Blinks the device LED at a specified rate. Parameters, (number of blinks, period in milliseconds between change in LED state).'
    }, {
      num: '7',
      name: 'Sensor LED On',
      param_count: 1,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'
    }, {
      num: '8',
      name: 'Sensor LED Off',
      param_count: 0,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Turns off the sensor LED. No parameters.'
    }, {
      num: '9',
      name: 'Read Sensors',
      param_count: 0,
      canMove: true,
      canDelete: false,
      canInsert: false,
      description: 'Takes readings from the sensors. No parameters. Only one allowed per assay'
    }, {
      num: '10',
      name: 'Read QR Code',
      param_count: 0,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'
    }, {
      num: '11',
      name: 'Disable Sensor',
      param_count: 0,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Disables the sensors, switching them to low-power mode. No parameters.'
    }, {
      num: '12',
      name: 'Repeat Begin',
      param_count: 1,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'
    }, {
      num: '13',
      name: 'Repeat End',
      param_count: 0,
      canMove: true,
      canDelete: true,
      canInsert: true,
      description: 'Ends the innermost block of repeated commands. No parameters.'
    }, {
      num: '99',
      name: 'Finish Test',
      param_count: 0,
      canMove: false,
      canDelete: false,
      canInsert: false,
      description: 'Finishes the test. Required to be the final command. No parameters.'
    }];

    function instruction_time(code, param) {
      var d = 0;

      switch (code) {
        case 'Delay': // delay
        case 'Solenoid On': // solenoid on
          d = parseInt(param);
          break;
        case 'Move': // move
          d = Math.floor(Math.abs(parseInt(param[0])) * parseInt(param[1]) / 1000);
          break;
        case 'Blink Device LED': // blink device LED
          d = 2 * Math.floor(parseInt(param[0]) * parseInt(param[1]));
          break;
        case 'Read Sensors': // read sensor
          d = 5000;
          break;
        case 'Start Test': // starting sensor reading plus LED warmup
          d = 6000;
          break;
        // case 'Finish Test': // write to flash and reset stage
        //   d = 16800;
        //   break;
      }

      return d;
    }

    function get_bcode_object(bcode) {
      var p, indx = bcode.params.toString().indexOf(',');
      return ({
        c: bcode.command,
        p: indx !== -1 ? bcode.params.split(',') : bcode.params.toString()
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

              duration += calculate_BCODE_time(a) * parseInt(b.p);
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

    $scope.activeBCODE = 0;
    $scope.command = $scope.BCODE[0].command;
    $scope.params = $scope.BCODE[0].params;
    $scope.commandDescription = $scope.BCODECommands[0].description;
    $scope.canMove = false;
    $scope.canDelete = false;
    $scope.canInsert = false;
    $scope.estimatedTime = get_BCODE_duration($scope.BCODE);

    $scope.changeCommand = function() {
      $scope.params = '';
      var b = _.findWhere($scope.BCODECommands, {
          name: $scope.command
        });
      $scope.canMove = b.canMove;
      $scope.canDelete = b.canDelete;
      $scope.canInsert = b.canInsert;
      $scope.commandDescription = b.description;
      console.log($scope.activeBCODE, $scope.command, $scope.canMove, $scope.canDelete, $scope.canInsert);
    };

    $scope.clickBCODECode = function(indx) {
      $scope.activeBCODE = indx;
      $scope.command = $scope.BCODE[indx].command;
      $scope.params = $scope.BCODE[indx].params;
      var b = _.findWhere($scope.BCODECommands, {
          name: $scope.command
        });
      $scope.canMove = b.canMove;
      $scope.canDelete = b.canDelete;
      $scope.canInsert = b.canInsert;
      $scope.commandDescription = b.description;
      console.log($scope.activeBCODE, $scope.command, $scope.canMove, $scope.canDelete, $scope.canInsert);
    };

    $scope.moveBCODETop = function() {
      if ($scope.canMove) {
        $scope.BCODE.splice(1, 0, $scope.BCODE.splice($scope.activeBCODE, 1)[0]);
        $scope.activeBCODE = 1;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.moveBCODEUp = function() {
      var code;

      if ($scope.activeBCODE > 1 && $scope.canMove) {
        code = $scope.BCODE.splice($scope.activeBCODE, 1)[0];
        $scope.activeBCODE -= 1;
        $scope.activeBCODE = ($scope.activeBCODE < 0 ? 0 : $scope.activeBCODE);
        $scope.BCODE.splice($scope.activeBCODE, 0, code);
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.moveBCODEDown = function() {
      var code;

      if ($scope.activeBCODE < $scope.BCODE.length - 2 && $scope.canMove) {
        code = $scope.BCODE.splice($scope.activeBCODE, 1)[0];
        $scope.activeBCODE += 1;
        $scope.activeBCODE = ($scope.activeBCODE > $scope.BCODE.length ? $scope.BCODE.length : $scope.activeBCODE);
        $scope.BCODE.splice($scope.activeBCODE, 0, code);
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.moveBCODEBottom = function() {
      if ($scope.canMove) {
        $scope.BCODE.splice($scope.BCODE.length - 2, 0, $scope.BCODE.splice($scope.activeBCODE, 1)[0]);
        $scope.activeBCODE = $scope.BCODE.length - 2;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    function validateCommandParams() {
      if (!$scope.command) {
        Notification.error('ERROR: No command selected');
        return false;
      }
      var cmd = _.findWhere($scope.BCODECommands, {
        name: $scope.command
      });
      var p = $scope.params.split(',');
      if (cmd.param_count === 0 && p.length === 1 && p[0] === '') {
        return true;
      }
      if (p.length !== cmd.param_count) {
        Notification.error('ERROR: Wrong number of parameters (' + p.length + ' found and ' + cmd.param_count + ' expected)');
        return false;
      }
      if (p.length > 0 && p[0]) {
        if (isNaN(parseInt(p[0], 10))) {
          Notification.error('ERROR: Non-numeric parameter (parameter 1 "' + p[0] + '" is not a number)');
          return false;
        }
        $scope.params = parseInt(p[0]);
      }
      if (p.length > 1) {
        if (isNaN(parseInt(p[1], 10))) {
          Notification.error('ERROR: Non-numeric parameter (parameter 2 "' + p[1] + '" is not a number)');
          return false;
        }
        $scope.params += ',' + parseInt(p[1]);
      }
      return true;
    }

    $scope.insertBCODETop = function() {
      if (validateCommandParams() && $scope.canInsert) {
        $scope.BCODE.splice(1, 0, {
          command: $scope.command,
          params: $scope.params
        });
        $scope.activeBCODE = 1;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.insertBCODEAbove = function() {
      if (validateCommandParams() && $scope.activeBCODE > 0 && $scope.canInsert) {
        $scope.BCODE.splice($scope.activeBCODE, 0, {
          command: $scope.command,
          params: $scope.params
        });
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.insertBCODEBelow = function() {
      if (validateCommandParams() && $scope.activeBCODE < $scope.BCODE.length - 1 && $scope.canInsert) {
        $scope.activeBCODE += 1;
        $scope.BCODE.splice($scope.activeBCODE, 0, {
          command: $scope.command,
          params: $scope.params
        });
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.insertBCODEBottom = function() {
      if (validateCommandParams() && $scope.canInsert) {
        $scope.BCODE.splice($scope.BCODE.length - 1, 0, {
          command: $scope.command,
          params: $scope.params
        });
        $scope.activeBCODE = $scope.BCODE.length - 2;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.cutBCODE = function() {
      if ($scope.BCODE.length && $scope.activeBCODE && $scope.canDelete) {
        $scope.clipboard = $scope.BCODE.splice($scope.activeBCODE, 1);
        delete $scope.clipboard._id;
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.copyBCODE = function() {
      $scope.clipboard = $scope.BCODE[$scope.activeBCODE];
    };

    $scope.copyAllBCODE = function() {
      $scope.clipboard = _.filter($scope.BCODE.slice(1, $scope.BCODE.length - 2), function(e) {return e.command !== 'Read Sensors';});
    };

    $scope.pasteBCODE = function() {
      if ($scope.activeBCODE > 0 && $scope.activeBCODE < $scope.BCODE.length - 1) {
        $scope.activeBCODE += 1;
        if (angular.isArray($scope.clipboard)) {
          $scope.clipboard.forEach(function(e, i) {
            $scope.BCODE.splice($scope.activeBCODE + i, 0, angular.copy(e));
          });
        } else {
          $scope.BCODE.splice($scope.activeBCODE, 0, angular.copy($scope.clipboard));
        }
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.updateBCODE = function() {
      if (validateCommandParams()) {
        $scope.BCODE[$scope.activeBCODE] = {
          command: $scope.command,
          params: $scope.params
        };
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.deleteBCODE = function() {
      if ($scope.BCODE.length && $scope.activeBCODE && $scope.canDelete) {
        $scope.BCODE.splice($scope.activeBCODE, 1);
        $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
      }
    };

    $scope.deleteAllBCODE = function() {
      $scope.BCODE = angular.copy(initialBCODE);
      $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
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
          $scope.commandDescription = _.findWhere($scope.BCODECommands, {
            name: $scope.command
          }).description;
          $scope.estimatedTime = get_BCODE_duration($scope.BCODE);
        }
        $scope.analysis = $scope.assay.analysis;
        $scope.standardCurve = $scope.assay.standardCurve;
        $scope.recalcInventory();
      });
    };
  }
]);
