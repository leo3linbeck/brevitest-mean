'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'brevitest';
	var applicationModuleVendorDependencies = [
		'ngResource',
		'ngCookies',
		'ngAnimate',
		'ngTouch',
		'ngSanitize',
    	'oitozero.ngSweetAlert',
		'ui.router',
		'ui.bootstrap',
		'ui.utils',
		'ui-notification',
		'btford.socket-io',
		'monospaced.qrcode',
		'ngCsv'
	];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('assays');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('cartridges');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');

'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('device-models');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('device-pools');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('devices');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('manufacturers');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('organizations');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('superusers');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('tests');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');
'use strict';

//Setting up route
angular.module('assays').config(['$stateProvider',
	function($stateProvider) {
		// Assays state routing
		$stateProvider.
		state('listAssays', {
			url: '/assays',
			templateUrl: 'modules/assays/views/list-assays.client.view.html'
		}).
		state('createAssay', {
			url: '/assays/create',
			templateUrl: 'modules/assays/views/create-assay.client.view.html'
		}).
		state('viewAssay', {
			url: '/assays/:assayId',
			templateUrl: 'modules/assays/views/view-assay.client.view.html'
		}).
		state('editAssay', {
			url: '/assays/:assayId/edit',
			templateUrl: 'modules/assays/views/edit-assay.client.view.html'
		});
	}
]);
'use strict';

var _ = window._;


// Assays controller
angular.module('assays').controller('AssaysController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Assays', 'Notification',
  function($scope, $http, $stateParams, $location, $window, Authentication, Assays, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

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

    $scope.loadUnusedCartridges = function() {
      $http.post('/assays/load_unused_cartridges', {
        assayID: $scope.assay._id
      }).
      success(function(data, status, headers, config) {
        $scope.cartridges = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.make10Cartridges = function() {
      console.log('Making 10 cartridges');
      $http.post('/assays/make_10_cartridges', {
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
      description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor gain code<<8+sensor integration time code, sensor LED power).'
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
      $scope.clipboard = _.filter($scope.BCODE.slice(1, $scope.BCODE.length - 2), function(e) {
        return e.command !== 'Read Sensors';
      });
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
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
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
        $location.path('assays');

        // Clear form fields
        $scope.name = '';
        $scope.reference = '';
        $scope.description = '';
        $scope.url = '';
        $scope.analysis = {};
        $scope.standardCurve = [];
        $scope.BCODE = [];
      }, function(errorResponse) {
          //$scope.error = errorResponse.data.message;
          Notification.error(errorResponse.data.message);
      });
    };

    // Remove existing Assay
    $scope.remove = function(assay) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (assay) {
          assay.$remove(function (response) {
              console.log(response.data.error);
              }, function(errorResponse) {
              console.log(errorResponse);
                    console.log(errorResponse.data.error);
                  Notification.error(errorResponse.data.message);
          });

          for (var i in $scope.assays) {
            if ($scope.assays[i] === assay) {
              $scope.assays.splice(i, 1);
            }
          }
        } else {
          $scope.assay.$remove(function(response) {
              $location.path('assays');
              if(response.error)
                var a = 12;
                Notification.error(response.error);
          });
        }
      }
    };

    // Update existing Assay
    $scope.update = function() {
      var assay = new Assays($scope.assay);

      assay.BCODE = $scope.BCODE;
      assay.analysis = $scope.analysis;
      assay.standardCurve = $scope.standardCurve;

      assay.$update(function() {
        $location.path('assays');
      }, function(errorResponse) {
          //$scope.error = errorResponse.data.message;
          Notification.error(errorResponse.data.message);
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

'use strict';

//Assays service used to communicate Assays REST endpoints
angular.module('assays').factory('Assays', ['$resource',
	function($resource) {
		return $resource('assays/:assayId', { assayId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('cartridges').config(['$stateProvider',
	function($stateProvider) {
		// Cartridges state routing
		$stateProvider.
		state('listCartridges', {
			url: '/cartridges',
			templateUrl: 'modules/cartridges/views/list-cartridges.client.view.html'
		}).
		state('cartridgeLabels', {
			url: '/cartridges/labels',
			templateUrl: 'modules/cartridges/views/labels-cartridges.client.view.html'
		}).
		state('loadCartridges', {
			url: '/cartridges/load',
			templateUrl: 'modules/cartridges/views/list-cartridges.client.view.html'
		}).
		state('createCartridge', {
			url: '/cartridges/create',
			templateUrl: 'modules/cartridges/views/create-cartridge.client.view.html'
		}).
		state('viewCartridge', {
			url: '/cartridges/:cartridgeId',
			templateUrl: 'modules/cartridges/views/view-cartridge.client.view.html'
		}).
		state('editCartridge', {
			url: '/cartridges/:cartridgeId/edit',
			templateUrl: 'modules/cartridges/views/edit-cartridge.client.view.html'
		});
	}
]);

'use strict';

// Cartridges controller
angular.module('cartridges').controller('CartridgesController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Notification', 'Cartridges', 'Assays',
	function($scope, $http, $stateParams, $location, $window, Authentication, Notification, Cartridges, Assays) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		$scope.showOnOpen = true;

		// Create new Cartridge
		$scope.create = function() {
			// Create new Cartridge object
			var cartridge = new Cartridges ({
				name: this.name
			});

			// Redirect after save
			cartridge.$save(function(response) {
				$location.path('cartridges');

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				//$scope.error = errorResponse.data.message;
				Notification.error(errorResponse.data.message);
			});
		};

		// Remove existing Cartridge
		$scope.remove = function(cartridge) {
			if ($window.confirm('Are you sure you want to delete this record?')) {
				if ( cartridge ) {
					cartridge.$remove();

					for (var i in $scope.cartridges) {
						if ($scope.cartridges [i] === cartridge) {
							$scope.cartridges.splice(i, 1);
						}
					}
				} else {
					$scope.cartridge.$remove(function() {
						$location.path('cartridges');
					});
				}
			}
		};

		// Update existing Cartridge
		$scope.update = function() {
			var cartridge = new Cartridges($scope.cartridge);

			cartridge.$update(function() {
				$location.path('cartridges');
			}, function(errorResponse) {
				//$scope.error = errorResponse.data.message;
                Notification.error(errorResponse.data.message);
			});
		};

		// Find a list of Cartridges
		$scope.find = function() {
			$scope.cartridges = Cartridges.query();
		};

		$scope.currentPage = 0;
		$scope.itemsPerPage = 10;

		$scope.pageChanged = function() {
			console.log($scope.currentPage);
			$scope.load();
		};

		$scope.load = function() {
	      $http.post('/cartridges/load', {
					page: $scope.currentPage,
					pageSize: $scope.itemsPerPage
				}).
					success(function(data, status, headers, config) {
	          console.log(data);
						$scope.cartridges = data.cartridges;
						$scope.totalItems = data.number_of_items;
				  }).
				  error(function(err, status, headers, config) {
						console.log(err);
						Notification.error(err.message);
				  });
		};

		// Find existing Cartridge
		$scope.findOne = function() {
			$scope.cartridge = Cartridges.get({
				cartridgeId: $stateParams.cartridgeId
			});
		};
	}
]);

'use strict';

var _ = window._;

// Cartridges controller
angular.module('cartridges').controller('CartridgeLabelsController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Notification', 'Cartridges', 'Assays',
	function($scope, $http, $stateParams, $location, $window, Authentication, Notification, Cartridges, Assays) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		$scope.showResultsOnOpen = true;

		$scope.selectedCartridges = {};
		$scope.numberOfSelectedCartridges = 0;
		$scope.selectCartridge = function(indx) {
			var id = $scope.cartridges[indx]._id;
			$scope.selectedCartridges[id] = !$scope.selectedCartridges[id];
			$scope.numberOfSelectedCartridges += $scope.selectedCartridges[id] ? 1 : -1;
		};
		$scope.cartridgeSelected = function(indx) {
			return !!$scope.selectedCartridges[$scope.cartridges[indx]._id];
		};
		$scope.selectAll = function() {
			$scope.cartridges.forEach(function(e, i) {
				$scope.numberOfSelectedCartridges += $scope.selectedCartridges[e._id] ? 0 : 1;
				$scope.selectedCartridges[e._id] = true;
			});
		};
		$scope.deselectAll = function() {
			$scope.cartridges.forEach(function(e, i) {
				$scope.numberOfSelectedCartridges += $scope.selectedCartridges[e._id] ? -1 : 0;
				$scope.selectedCartridges[e._id] = false;
			});
		};

		// Update existing Cartridge
		$scope.update = function() {
			var cartridge = $scope.cartridge;

			cartridge.$update(function() {
				$location.path('cartridges/' + cartridge._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.skips = 0;

		$scope.adjustSkips = function() {
			$http.post('/cartridges/load-labels', {
				page: $scope.currentPage,
				pageSize: $scope.itemsPerPage
			}).
				success(function(data, status, headers, config) {
					console.log(data);
					$scope.cartridges = data.cartridges;
					for (var i = 0; i < $scope.skips; i += 1) {
						$scope.cartridges.splice(0, 0, {_id: 'nothing'});
					}
					$scope.totalItems = data.number_of_items + $scope.skips;
					$scope.totalItems = $scope.totalItems > 32 ? 32 : $scope.totalItems;
					$scope.cartridges.length = $scope.totalItems;
				}).
				error(function(err, status, headers, config) {
					console.log(err);
					Notification.error(err.message);
				});
		};

		$scope.dropLabel = function(indx) {
			$scope.cartridges.splice(indx, 1);
		};

		$scope.currentPage = 0;
		$scope.itemsPerPage = 32;

		$scope.pageChanged = function() {
			console.log($scope.currentPage);
			$scope.load();
		};

		$scope.load = function() {
	      $http.post('/cartridges/load-labels', {
					page: $scope.currentPage,
					pageSize: $scope.itemsPerPage
				}).
					success(function(data, status, headers, config) {
	          console.log(data);
						$scope.cartridges = data.cartridges;
						$scope.totalItems = data.number_of_items;
				  }).
				  error(function(err, status, headers, config) {
						console.log(err);
						Notification.error(err.message);
				  });
		};
	}
]);

'use strict';

//Cartridges service used to communicate Cartridges REST endpoints
angular.module('cartridges').factory('Cartridges', ['$resource',
	function($resource) {
		return $resource('cartridges/:cartridgeId', { cartridgeId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('core').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'View', 'view', 'dropdown', '(/assays)?(/devices)?(/device-models)?(/device-pools)?(/organizations)?', 'menu.isPublic', ['user']);
		Menus.addSubMenuItem('topbar', 'view', 'Assays', 'assays', '/assays', 'menu.isPublic');
		Menus.addSubMenuItem('topbar', 'view', 'Devices', 'devices', '/devices');
		Menus.addSubMenuItem('topbar', 'view', 'Device Pools', 'device-pools', '/device-pools');
		Menus.addSubMenuItem('topbar', 'view', 'Device Models', 'device-models', '/device-models');
		Menus.addSubMenuItem('topbar', 'view', 'Organizations', 'organizations', '/organizations');

		Menus.addMenuItem('topbar', 'Create', 'new', 'dropdown', '(/assays)?(/devices)?(/device-pools)?(/device-models)?(/organizations)?/create', 'menu.isPublic', ['user']);
    	Menus.addSubMenuItem('topbar', 'new', 'Assay', 'assays/create', '/assays/create', 'menu.isPublic');
		Menus.addSubMenuItem('topbar', 'new', 'Device', 'devices/create', '/devices/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device Pool', 'device-pools/create', '/device-pools/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device Model', 'device-models/create', '/device-models/create');
		Menus.addSubMenuItem('topbar', 'new', 'Cartridge Labels', 'cartridges/labels', '/cartridges/labels');
		Menus.addSubMenuItem('topbar', 'new', 'Organization', 'organizations/create', '/organizations/create');

    	Menus.addMenuItem('topbar', 'Manage Users', 'superusers', 'dropdown', '/superusers(/create)?', 'menu.isPublic', ['superuser']);
    	Menus.addSubMenuItem('topbar', 'superusers', 'List Users', 'superusers');
	}
]);

'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');
		// Home state routing
		$stateProvider.
		state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$location', 'Authentication', 'Menus',
	function($scope, $location, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
		$scope.var = 12;
		//console.log(unconfirmedUsers);
	}
]);

'use strict';


angular.module('core').controller('HomeController', ['$scope', '$location', 'Authentication', 'Notification',
	function($scope, $location, Authentication, Notification) {

		// This provides Authentication context.
		$scope.authentication = Authentication;
		if (!$scope.authentication.user) {
			$location.path('/signin');
        }

		$scope.showDetail = false;

        // disable JSHint error: 'confusing user of !'
        /*jshint -W018 */
        if ($scope.authentication.user) {
            if (!($scope.authentication.user.roles.indexOf('user') > -1)) { // if the user doesn't have user privileges but does exist display message
                Notification.error('You do not currently have user privileges. Functionality will be extremely limited. Please contact an administrator and request user privileges.');
            } else console.log('Roles: ' + $scope.authentication.user.roles);
        }
        /*jshint +W018 */

	}
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

	function() {
		// Define a set of default roles
		this.defaultRoles = ['*'];

		// Define the menus object
		this.menus = {};

		// A private function for rendering decision
		var shouldRender = function(user) {
			if (user) {
				if (!!~this.roles.indexOf('*')) {
					return true;
				} else {
					for (var userRoleIndex in user.roles) {
						for (var roleIndex in this.roles) {
							if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			} else {
				return this.isPublic;
			}

			return false;
		};

		// Validate menu existance
		this.validateMenuExistance = function(menuId) {
			if (menuId && menuId.length) {
				if (this.menus[menuId]) {
					return true;
				} else {
					throw new Error('Menu does not exists');
				}
			} else {
				throw new Error('MenuId was not provided');
			}

			return false;
		};

		// Get the menu object by menu id
		this.getMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			return this.menus[menuId];
		};

		// Add new menu object by menu id
		this.addMenu = function(menuId, isPublic, roles) {
			// Create the new menu
			this.menus[menuId] = {
				isPublic: isPublic || false,
				roles: roles || this.defaultRoles,
				items: [],
				shouldRender: shouldRender
			};

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			delete this.menus[menuId];
		};

		// Add menu item object
		this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Push new menu item
			this.menus[menuId].items.push({
				title: menuItemTitle,
				link: menuItemURL,
				menuItemType: menuItemType || 'item',
				menuItemClass: menuItemType,
				uiRoute: menuItemUIRoute || ('/' + menuItemURL),
				isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
				roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
				position: position || 0,
				items: [],
				shouldRender: shouldRender
			});

			// Return the menu object
			return this.menus[menuId];
		};

		// Add submenu item object
		this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
					// Push new submenu item
					this.menus[menuId].items[itemIndex].items.push({
						title: menuItemTitle,
						link: menuItemURL,
						uiRoute: menuItemUIRoute || ('/' + menuItemURL),
						isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
						roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
						position: position || 0,
						shouldRender: shouldRender
					});
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenuItem = function(menuId, menuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
					this.menus[menuId].items.splice(itemIndex, 1);
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeSubMenuItem = function(menuId, submenuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		//Adding the topbar menu
		this.addMenu('topbar');
	}
]);

'use strict';
/*global io:false */
//socket factory that provides the socket service
angular.module('core').factory('Socket', ['socketFactory', '$location',
    function(socketFactory, $location) {
      console.log('socket.io $location', $location);
        return socketFactory({
            prefix: '',
            ioSocket: io.connect($location.protocol() + '://' + $location.host() + ':' + $location.port())
        });
    }
]);

'use strict';

//Setting up route
angular.module('device-models').config(['$stateProvider',
	function($stateProvider) {
		// Device models state routing
		$stateProvider.
		state('listDeviceModels', {
			url: '/device-models',
			templateUrl: 'modules/device-models/views/list-device-models.client.view.html'
		}).
		state('createDeviceModel', {
			url: '/device-models/create',
			templateUrl: 'modules/device-models/views/create-device-model.client.view.html'
		}).
		state('viewDeviceModel', {
			url: '/device-models/:deviceModelId',
			templateUrl: 'modules/device-models/views/view-device-model.client.view.html'
		}).
		state('editDeviceModel', {
			url: '/device-models/:deviceModelId/edit',
			templateUrl: 'modules/device-models/views/edit-device-model.client.view.html'
		});
	}
]);
'use strict';

// Device models controller
angular.module('device-models').controller('DeviceModelsController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'DeviceModels', 'Devices', 'Notification',
  function($scope, $http, $stateParams, $location, $window, Authentication, DeviceModels, Devices, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.loadDevices = function() {
      if (!$scope.devices) {
        $http.post('/devices/load_by_model', {
          deviceModelID: $scope.deviceModel._id
        }).
        success(function(data, status, headers, config) {
          $scope.devices = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
      }
    };

    // Create new Device model
    $scope.create = function() {
      // Create new Device model object
      var deviceModel = new DeviceModels({
        name: this.name,
        reference: this.reference,
        description: this.description
      });

      // Redirect after save
      deviceModel.$save(function(response) {
        $location.path('device-models');

        // Clear form fields
        $scope.name = '';
        $scope.reference = '';
        $scope.description = '';
      }, function(errorResponse) {
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
      });
    };

    // Remove existing Device model
    $scope.remove = function(deviceModel) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (deviceModel) {
          deviceModel.$remove();

          for (var i in $scope.deviceModels) {
            if ($scope.deviceModels[i] === deviceModel) {
              $scope.deviceModels.splice(i, 1);
            }
          }
        } else {
          $scope.deviceModel.$remove(function() {
            $location.path('device-models');
          });
        }
      }
    };

    // Update existing Device model
    $scope.update = function() {
      var deviceModel = new DeviceModels($scope.deviceModel);

      deviceModel.$update(function() {
        $location.path('device-models');
      }, function(errorResponse) {
          //$scope.error = errorResponse.data.message;
          Notification.error(errorResponse.data.message);
      });
    };

    // Find a list of Device models
    $scope.find = function() {
      $scope.deviceModels = DeviceModels.query();
    };

    // Find existing Device model
    $scope.findOne = function() {
      $scope.deviceModel = DeviceModels.get({
        deviceModelId: $stateParams.deviceModelId
      });
    };
  }
]);

'use strict';

//Device models service used to communicate Device models REST endpoints
angular.module('device-models').factory('DeviceModels', ['$resource',
	function($resource) {
		return $resource('device-models/:deviceModelId', { deviceModelId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('device-pools').config(['$stateProvider',
	function($stateProvider) {
		// Device pools state routing
		$stateProvider.
		state('listDevicePools', {
			url: '/device-pools',
			templateUrl: 'modules/device-pools/views/list-device-pools.client.view.html'
		}).
		state('createDevicePool', {
			url: '/device-pools/create',
			templateUrl: 'modules/device-pools/views/create-device-pool.client.view.html'
		}).
		state('selectDevicePool', {
			url: '/device-pools/select',
			templateUrl: 'modules/device-pools/views/select-device-pool.client.view.html'
		}).
		state('viewDevicePool', {
			url: '/device-pools/:devicePoolId',
			templateUrl: 'modules/device-pools/views/view-device-pool.client.view.html'
		}).
		state('editDevicePool', {
			url: '/device-pools/:devicePoolId/edit',
			templateUrl: 'modules/device-pools/views/edit-device-pool.client.view.html'
		});
	}
]);

'use strict';

var _ = window._;

// Device pools controller
angular.module('device-pools').controller('DevicePoolsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'DevicePools', 'Users', 'Organizations', 'Notification',
  function($scope, $stateParams, $location, $http, Authentication, DevicePools, Users, Organizations, Notification) {
    $scope.authentication = Authentication;

		$scope.loadData = function() {
			$scope.organizations = Organizations.query();
		};

    $scope.organization = {};
    $scope.selectOrganization = function(id) {
      $scope.organization._id = id;
    };

    $scope.selectDevicePool = function(index) {
      if ($scope.authentication.user._devicePool !== $scope.devicePools[index]._id) {
        $scope.authentication.user._devicePool = $scope.devicePools[index]._id;
        var user = new Users($scope.authentication.user);
        user.$update(function(response) {
          $scope.authentication.user = response;
        }, function(response) {
          $scope.error = response.data.message;
        });
      }
      $http.post('/devices/pool', {
        devicePoolID: $scope.devicePools[index]._id
      }).
      success(function(data, status, headers, config) {
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    // Create new Device pool
    $scope.create = function() {
      // Create new Device pool object
      var devicePool = new DevicePools({
        name: this.name,
        description: this.description,
        _organization: this.organization._id
      });

      // Redirect after save
      devicePool.$save(function(response) {
        $location.path('device-pools');

        // Clear form fields
        $scope.name = '';
        $scope.description = '';
        $scope._organization = {};
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Device pool
    $scope.remove = function(devicePool) {
      if (devicePool) {
        devicePool.$remove();

        for (var i in $scope.devicePools) {
          if ($scope.devicePools[i] === devicePool) {
            $scope.devicePools.splice(i, 1);
          }
        }
      } else {
        $scope.devicePool.$remove(function() {
          $location.path('device-pools');
        });
      }
    };

    // Update existing Device pool
    $scope.update = function() {
      var devicePool = new DevicePools($scope.devicePool);
      devicePool._organization = $scope.organization ? $scope.organization._id : '';

      devicePool.$update(function() {
        $location.path('device-pools');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Device pools
    $scope.find = function() {
      $scope.devicePools = DevicePools.query();
    };

    // Find existing Device pool
    $scope.findOne = function() {
      $scope.devicePool = DevicePools.get({
        devicePoolId: $stateParams.devicePoolId
      }, function() {
        $scope.organizations = $scope.organizations || Organizations.query();
        $scope.organization = $scope.devicePool._organization || {};
        $http.post('/devices/pool', {
          devicePoolID: $stateParams.devicePoolId
        }).
        success(function(data, status, headers, config) {
          $scope.devices = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
      });
    };
  }
]);

'use strict';

//Device pools service used to communicate Device pools REST endpoints
angular.module('device-pools').factory('DevicePools', ['$resource',
	function($resource) {
		return $resource('device-pools/:devicePoolId', { devicePoolId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('devices').config(['$stateProvider',
	function($stateProvider) {
		// Devices state routing
		$stateProvider.
		state('listDevices', {
			url: '/devices',
			templateUrl: 'modules/devices/views/list-devices.client.view.html'
		}).
		state('createDevice', {
			url: '/devices/create',
			templateUrl: 'modules/devices/views/create-device.client.view.html'
		}).
		state('viewDevice', {
			url: '/devices/:deviceId',
			templateUrl: 'modules/devices/views/view-device.client.view.html'
		}).
		state('editDevice', {
			url: '/devices/:deviceId/edit',
			templateUrl: 'modules/devices/views/edit-device.client.view.html'
		});
	}
]);
'use strict';

// Devices controller
angular.module('devices').controller('DevicesController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Devices', 'DeviceModels', 'DevicePools', 'Notification',
  function($scope, $http, $stateParams, $location, $window, Authentication, Devices, DeviceModels, DevicePools, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.unassigned = false;
    $scope.loadUnassigned = function() {
      $scope.unassigned = true;
      $http.get('/devices/unassigned').
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.writeSerialNumber = function() {
      $http.post('/devices/write_serial_number', {
        deviceID: $scope.device._id,
        serialNumber: $scope.device.serialNumber
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success('Serial number updated on device');
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.attachParticle = function() {
      $http.post('/devices/attach_particle', {
        deviceID: $scope.device._id
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success('Particle attached');
        $scope.device = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.detachParticle = function() {
      $http.post('/devices/detach_particle', {
        deviceID: $scope.device._id
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success('Particle detached');
        $scope.device = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.loadData = function() {
      $scope.deviceModels = DeviceModels.query();
      $scope.devicePools = DevicePools.query();
    };

    $scope.refresh = function() {
      $scope.unassigned = false;
      $http.post('/devices/pool').
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.moveToAndSetCalibrationPoint = function() {
      $http.post('/devices/move_to_and_set_calibration_point', {
        device: $scope.device
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success(data.msg);
        $scope.device.$save();
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.flashFirmware = function() {
      $http.post('/devices/flash_firmware', {
        device: $scope.device
      }).
      success(function(data, status, headers, config) {
        console.log(data.msg);
        Notification.success('Firmware flash underway...');
        $scope.device.$save();
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.setOnlineButtonText = function() {
      if ($scope.online) {
        $scope.onlineText = 'Online';
      } else {
        $scope.onlineText = 'Offline';
      }
    };

    $scope.deviceModel = {};
    $scope.devicePool = {};

    $scope.openedMfg = false;
    $scope.openedReg = false;
    $scope.minRegDate = $scope.manufacturedOn;

    $scope.setRegMinDate = function() {
      $scope.minRegDate = $scope.manufacturedOn;
    };

    $scope.selectDeviceModel = function(id) {
      $scope.deviceModel._id = id;
    };

    $scope.selectDevicePool = function(id) {
      $scope.devicePool._id = id;
    };

    $scope.openDatepicker = function($event, dateField) {
      $event.preventDefault();
      $event.stopPropagation();

      switch (dateField) {
        case 'mfg':
          $scope.openedMfg = !$scope.openedMfg;
          break;
        case 'reg':
          $scope.openedReg = !$scope.openedReg;
          break;
      }
    };

    // Create new Device
    $scope.create = function() {
      // Create new Device object
      var device = new Devices({
        name: this.name,
        serialNumber: this.serialNumber,
        calibrationSteps: this.calibrationSteps,
        status: this.status,
        manufacturedOn: this.manufacturedOn,
        registeredOn: this.registeredOn,
        _deviceModel: this.deviceModel._id,
        _devicePool: this.devicePool._id,
        particleID: this.particleID
      });

      // Redirect after save
      device.$save(function(response) {
        $location.path('devices');

        // Clear form fields
        $scope.name = '';
        $scope.particleID = '';
        $scope.serialNumber = '';
        $scope.calibrationSteps = '';
        $scope.status = '';
        $scope.manufacturedOn = '';
        $scope.registeredOn = '';
        $scope.deviceModel = {};
        $scope.devicePool = {};
      }, function(errorResponse) {
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
      });
    };

    // Remove existing Device
    $scope.remove = function(device) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (device) {
          device.$remove();

          for (var i in $scope.devices) {
            if ($scope.devices[i] === device) {
              $scope.devices.splice(i, 1);
            }
          }
        } else {
          $scope.device.$remove(function() {
            $location.path('devices');
          });
        }
      }
    };

    // Update existing Device
    $scope.update = function() {
      var device = new Devices($scope.device);
      device._deviceModel = $scope.deviceModel ? $scope.deviceModel._id : '';
      device._devicePool = $scope.devicePool ? $scope.devicePool._id : '';

      device.$update(function() {
        $location.path('devices');
      }, function(errorResponse) {
        //$scope.error = errorResponse.data.message;
        Notification.error(errorResponse.data.message);
      });
    };

    // Find a list of Devices
    $scope.find = function() {
      $scope.devices = Devices.query();
    };

    // Find existing Device
    $scope.findOne = function() {
      $scope.device = Devices.get({
        deviceId: $stateParams.deviceId
      }, function() {
        $scope.deviceModels = $scope.deviceModels || DeviceModels.query();
        $scope.devicePools = $scope.devicePools || DevicePools.query();
        $scope.setOnlineButtonText();
        $scope.deviceModel = $scope.device._deviceModel ? $scope.device._deviceModel : {};
        $scope.devicePool = $scope.device._devicePool ? $scope.device._devicePool : {};
      });
    };
  }
]);

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

'use strict';

//Devices service used to communicate Devices REST endpoints
angular.module('devices').factory('Devices', ['$resource',
	function($resource) {
		return $resource('devices/:deviceId', { deviceId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);

'use strict';

//Setting up route
angular.module('manufacturers').config(['$stateProvider',
	function($stateProvider) {
		// Manufacturers state routing
		$stateProvider.
		state('listManufacturers', {
			url: '/manufacturers',
			templateUrl: 'modules/manufacturers/views/list-manufacturers.client.view.html'
		}).
		state('createManufacturer', {
			url: '/manufacturers/create',
			templateUrl: 'modules/manufacturers/views/create-manufacturer.client.view.html'
		}).
		state('viewManufacturer', {
			url: '/manufacturers/:manufacturerId',
			templateUrl: 'modules/manufacturers/views/view-manufacturer.client.view.html'
		}).
		state('editManufacturer', {
			url: '/manufacturers/:manufacturerId/edit',
			templateUrl: 'modules/manufacturers/views/edit-manufacturer.client.view.html'
		});
	}
]);
'use strict';

// Manufacturers controller
angular.module('manufacturers').controller('ManufacturersController', ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'Manufacturers',
  function($scope, $stateParams, $location, $window, Authentication, Manufacturers) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.addresses = [];
    $scope.addressTypes = ['Main', 'Business', 'Operations', 'Other'];
    $scope.addressTypes.forEach(function(a) {
      $scope.addresses.push({
        location: a,
        street1: '',
        street2: '',
        city: '',
        state: '',
        zipcode: ''
      });
    });

    // Create new Manufacturer
    $scope.create = function() {
      // Create new Manufacturer object
      var manufacturer = new Manufacturers({
        name: this.name,
        addresses: this.addresses
      });

      // Redirect after save
      manufacturer.$save(function(response) {
        $location.path('manufacturers');

        // Clear form fields
        $scope.name = '';
        $scope.addresses = [];
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Manufacturer
    $scope.remove = function(manufacturer) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (manufacturer) {
          manufacturer.$remove();

          for (var i in $scope.manufacturers) {
            if ($scope.manufacturers[i] === manufacturer) {
              $scope.manufacturers.splice(i, 1);
            }
          }
        } else {
          $scope.manufacturer.$remove(function() {
            $location.path('manufacturers');
          });
        }
      }
    };

    // Update existing Manufacturer
    $scope.update = function() {
      var manufacturer = new Manufacturers($scope.manufacturer);

      manufacturer.addresses = $scope.addresses;
      manufacturer.$update(function() {
        $location.path('manufacturers');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Manufacturers
    $scope.find = function() {
      $scope.manufacturers = Manufacturers.query();
    };

    // Find existing Manufacturer
    $scope.findOne = function() {
      $scope.manufacturer = Manufacturers.get({
        manufacturerId: $stateParams.manufacturerId
      }, function() {
        $scope.addresses = $scope.manufacturer.addresses.length ? $scope.manufacturer.addresses : $scope.addresses;
      });
    };
  }
]);

'use strict';

//Manufacturers service used to communicate Manufacturers REST endpoints
angular.module('manufacturers').factory('Manufacturers', ['$resource',
	function($resource) {
		return $resource('manufacturers/:manufacturerId', { manufacturerId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('organizations').config(['$stateProvider',
	function($stateProvider) {
		// Organizations state routing
		$stateProvider.
		state('listOrganizations', {
			url: '/organizations',
			templateUrl: 'modules/organizations/views/list-organizations.client.view.html'
		}).
		state('createOrganization', {
			url: '/organizations/create',
			templateUrl: 'modules/organizations/views/create-organization.client.view.html'
		}).
		state('viewOrganization', {
			url: '/organizations/:organizationId',
			templateUrl: 'modules/organizations/views/view-organization.client.view.html'
		}).
		state('editOrganization', {
			url: '/organizations/:organizationId/edit',
			templateUrl: 'modules/organizations/views/edit-organization.client.view.html'
		});
	}
]);
'use strict';

// Organizations controller
angular.module('organizations').controller('OrganizationsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Organizations',
	function($scope, $stateParams, $location, Authentication, Organizations) {
		$scope.authentication = Authentication;

		// Create new Organization
		$scope.create = function() {
			// Create new Organization object
			var organization = new Organizations ({
				name: this.name
			});

			// Redirect after save
			organization.$save(function(response) {
				$location.path('organizations');

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Organization
		$scope.remove = function(organization) {
			if ( organization ) {
				organization.$remove();

				for (var i in $scope.organizations) {
					if ($scope.organizations [i] === organization) {
						$scope.organizations.splice(i, 1);
					}
				}
			} else {
				$scope.organization.$remove(function() {
					$location.path('organizations');
				});
			}
		};

		// Update existing Organization
		$scope.update = function() {
			var organization = new Organizations($scope.organization);

			organization.$update(function() {
				$location.path('organizations');
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Organizations
		$scope.find = function() {
			$scope.organizations = Organizations.query();
		};

		// Find existing Organization
		$scope.findOne = function() {
			$scope.organization = Organizations.get({
				organizationId: $stateParams.organizationId
			});
		};
	}
]);

'use strict';

//Organizations service used to communicate Organizations REST endpoints
angular.module('organizations').factory('Organizations', ['$resource',
	function($resource) {
		return $resource('organizations/:organizationId', { organizationId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('superusers').config(['$stateProvider',
	function($stateProvider) {
		// Superusers state routing
		$stateProvider.
		state('listSuperusers', {
			url: '/superusers',
			templateUrl: 'modules/superusers/views/list-superusers.client.view.html'
		}).
		state('viewSuperuser', {
			url: '/superusers/:userId',
			templateUrl: 'modules/superusers/views/view-superuser.client.view.html'
		}).
		state('editSuperuser', {
			url: '/superusers/:userId/edit',
			templateUrl: 'modules/superusers/views/edit-superuser.client.view.html'
		});
	}
]);

'use strict';

// Superusers controller
angular.module('superusers').controller('SuperusersController', ['$scope', '$stateParams', '$window', '$location', 'Authentication', 'Superusers', 'Notification', 'swalConfirm', 'poop',
    function ($scope, $stateParams, $window, $location, Authentication, Superusers, Notification, swalConfirm, poop) {
        $scope.authentication = Authentication;

        $scope.remove = function (superuser) {
            swalConfirm.swal(superuser, function (superuser) {
                if (superuser) {  // if a superuser is passed
                    superuser.$remove(function (response) {
                        if (response.error) {
                            /*global swal */
                            swal({title: '', showConfirmButton: false, timer: 0}); // create an alert an close instantly to trick sweet alerts into thinking you displayed a followup alert
                            Notification.error(response.error);
                            $scope.superuser = response.superuser;
                        }
                        else {
                            /*global swal */
                            swal({title: 'Success!', text: 'User ' + superuser.displayName + ' has been deleted!', type: 'success', confirmButtonColor: '#5cb85c'});
                            for (var i in $scope.superusers) {
                                if ($scope.superusers [i] === superuser) {
                                    $scope.superusers.splice(i, 1);
                                }
                            }
                            $location.path('superusers');
                        }
                    });
                } else {    // if no superuser is passed use the scope superuser
                    $scope.superuser.$remove(function () {
                        $location.path('superusers');  // redirect to the list superusers page
                    });
                }
            },
                {title: 'Are you sure?', text: 'Your will not be able to recover this user!', type: 'error', showCancelButton: true, confirmButtonColor: '#d9534f', confirmButtonText: 'Yes, delete it!', cancelButtonText: 'No, cancel it!', closeOnConfirm: false, closeOnCancel: true}
            );
        };

        // Update existing Superuser
        $scope.update = function () {
            $scope.superuser.roles = [];

            if ($scope.checkModel.user === true)
                $scope.superuser.roles.push('user');
            if ($scope.checkModel.admin === true)
                $scope.superuser.roles.push('admin');
            if ($scope.checkModel.superuser === true)
                $scope.superuser.roles.push('superuser');

            $scope.superuser.$update(function (response) {
                $location.path('superusers/' + $scope.superuser._id);
            }, function (errorResponse) {
                $scope.error = errorResponse.data.message;
            });
            swal({title: 'Success!', text: $scope.superuser.displayName + ' has been updated!', type: 'success', confirmButtonColor: '#5cb85c'});
        };

        // Find a list of Superusers
        $scope.find = function () {
            $scope.superusers = Superusers.query(function (response) {
                console.log(response);
                for (var i in response) {
                    console.log(response[i].firstName);
                }
            }, function (err) {
                $scope.error = err.data.message;
            });
        };

        // Find existing Superuser
        $scope.findOne = function () {
            $scope.superuser = Superusers.get({
                userId: $stateParams.userId
            }, function (response) {
                $scope.checkModel = {   // checkModel is bound to 3 buttons on the edit view used for changing user permissions
                    user: $scope.superuser.roles.indexOf('user') > -1,  // true if user has role 'user'
                    admin: $scope.superuser.roles.indexOf('admin') > -1, // true if user has role 'admin'
                    superuser: $scope.superuser.roles.indexOf('superuser') > -1 // true if user has role 'superuser'
                };
            });
        };
    }
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('swalConfirm', [
    function () {
        return {
            swal: function(callParams, callFunc, swalParams) {
                /*globals swal */
                swal({title: swalParams.title, text: swalParams.text, type: swalParams.type, showCancelButton: swalParams.showCancelButton, confirmButtonColor: swalParams.confirmButtonColor, confirmButtonText: swalParams.confirmButtonText, cancelButtonText: swalParams.cancelButtonText, closeOnConfirm: swalParams.closeOnConfirm, closeOnCancel: swalParams.closeOnCancel}, function (confirmed) {
                    if (!confirmed)
                            return;
                    callFunc(callParams);
                });
            }
        };
    }
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('Superusers', ['$resource',
	function($resource) {
		return $resource('users/:userId', { userId: '@_id'
        }, {
			update: {
				method: 'PUT'
			}
		});
	}
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('poop', [
    function () {
        return {
            swal: function(callParams, callFunc, swalParams) {
                /*globals swal */
                swal({title: swalParams.title, text: swalParams.text, type: swalParams.type, showCancelButton: swalParams.showCancelButton, confirmButtonColor: swalParams.confirmButtonColor, confirmButtonText: swalParams.confirmButtonText, cancelButtonText: swalParams.cancelButtonText, closeOnConfirm: swalParams.closeOnConfirm, closeOnCancel: swalParams.closeOnCancel}, function (confirmed) {
                    if (!confirmed)
                        return;
                    callFunc(callParams);
                });
            }
        };
    }
]);

'use strict';

//Setting up route
angular.module('tests').config(['$stateProvider',
	function($stateProvider) {
		// Tests state routing
		$stateProvider.
		state('listTests', {
			url: '/tests',
			templateUrl: 'modules/tests/views/list-tests.client.view.html'
		}).
		state('loadTests', {
			url: '/tests/load',
			css: 'modules/tests/css/review-test.client.css',
			templateUrl: 'modules/tests/views/review-test.client.view.html'
		}).
		state('createTest', {
			url: '/tests/create',
			templateUrl: 'modules/tests/views/create-test.client.view.html'
		}).
		state('runTests', {
			url: '/tests/run',
			templateUrl: 'modules/tests/views/run-test.client.view.html'
		}).
		state('monitorTests', {
			url: '/tests/monitor',
			templateUrl: 'modules/tests/views/monitor-test.client.view.html'
		}).
		state('reviewTests', {
			url: '/tests/review',
			css: 'modules/tests/css/review-test.client.css',
			templateUrl: 'modules/tests/views/review-test.client.view.html'
		}).
		state('exportTests', {
			url: '/tests/export',
			templateUrl: 'modules/tests/views/export-test.client.view.html'
		}).
		state('viewTest', {
			url: '/tests/:testId',
			templateUrl: 'modules/tests/views/view-test.client.view.html'
		}).
		state('editTest', {
			url: '/tests/:testId/edit',
			templateUrl: 'modules/tests/views/edit-test.client.view.html'
		});
	}
]);

'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('ExportTestController', ['$scope', '$http', '$timeout', '$location', 'Authentication', 'Tests', 'Notification', 'CSV',
	function($scope, $http, $timeout, $location, Authentication, Tests, Notification, CSV) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		function updateTest(test) {
      $http.post('/tests/update_one_test', {
        testID: test._id,
        cartridgeID: test._cartridge._id,
        deviceID: test._device._id,
				analysis: test._assay.analysis,
				status: test.status,
        percentComplete: test.percentComplete
      }).
      success(function(data, status, headers, config) {
				Notification.success('Test complete');
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
    }

		$scope.clickTest = function(indx) {
			var id = $scope.tests[indx]._id;
			var pos = $scope.selection.indexOf(id);
			if (pos === -1) {
				$scope.selection.push(id);
			}
			else {
				$scope.selection.splice(pos, 1);
			}
		};

		$scope.selectAll = function() {
			$scope.selection = _.pluck($scope.tests, '_id');
		};

		$scope.deselectAll = function() {
			$scope.selection.length = 0;
		};

		var exportMap = {
			'Test ID': '_id',
			'Assay Name': ['_assay', 'name'],
			'Assay ID': ['_assay', '_id'],
			'Cartridge ID': ['_cartridge', '_id'],
			'Device Name': ['_device', 'name'],
			'Device ID': ['_device', '_id'],
			'Particle ID': ['_device', 'particleID'],
			'Reference': 'reference',
			'Subject': 'subject',
			'Description': 'description',
			'Started On': ['_cartridge', 'startedOn'],
			'Finished On': ['_cartridge', 'finishedOn'],
			'Value': ['_cartridge', 'value'],
			'Reading': 'reading',
			'Result': 'result',
			'Red Max': ['analysis', 'redMax'],
			'Green Max': ['analysis', 'greenMax'],
			'Green Min': ['analysis', 'greenMin'],
			'Red Min': ['analysis', 'redMin'],
			'Standard Curve': 'standardCurve'
		};
		var exportKeys = Object.keys(exportMap);

		function mapFunction(e) {
			var obj = {};
			exportKeys.forEach(function(key) {
				var val = exportMap[key];
				var temp;
				if (angular.isArray(val)) {
					temp = e[val[0]][val[1]];
				}
				else {
					temp = e[val];
				}
				if (angular.isObject(temp)) {
					obj[key] = JSON.stringify(temp);
				}
				else {
					obj[key] = temp.toString();
				}
			});
			return obj;
		}

		$scope.getTestData = function() {
			var a = _.filter($scope.tests, function(e) { return ($scope.selection.indexOf(e._id) !== -1 && e.loaded); });
			console.log(a);
			var b = _.map(a, mapFunction);
			console.log(b);
			return b;
		};

		$scope.getTestHeaders = function() {
			return exportKeys;
		};

		$scope.setup = function() {
			$scope.selection = [];
			$http.get('/tests/exportable').
				success(function(data, status, headers, config) {
					$scope.tests = data;
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
		};

		$scope.cancelTest = function(index) {
			var test = $scope.tests[index];

			$http.post('/tests/cancel', {
				testID: test._id,
				cartridgeID: test._cartridge._id,
				deviceID: test._device._id,
				deviceName: test._device.name
			}).
				success(function(data, status, headers, config) {
					test.status = 'Cancelled';
					Notification.success('Test cancelled');
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};
	}
]);

'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', '$location', 'Authentication', 'Tests', 'Notification', 'Socket',
	function($scope, $http, $timeout, $location, Authentication, Tests, Notification, Socket) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

		function updateTest(test) {
      $http.post('/tests/update_one_test', {
        testID: test._id,
        cartridgeID: test._cartridge._id,
        deviceID: test._device._id,
				analysis: test._assay.analysis,
				status: test.status,
        percentComplete: test.percentComplete
      }).
      success(function(data, status, headers, config) {
				Notification.success('Test complete');
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
    }

		$scope.setup = function() {
			$http.get('/tests/recently_started').
				success(function(data, status, headers, config) {
					$scope.tests = data;
					Socket.on('test.update', function(message) {
						var data = message.split('\n');
						_.find($scope.tests, function(e) {
							if (e._id === data[1]) {
								e.percentComplete = parseInt(data[2]);
								e.status = data[0].length ? data[0] : e.status;
								return true;
							}
							return false;
						});
					});
		  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });
		};

		$scope.cancelTest = function(index) {
			var test = $scope.tests[index];

			$http.post('/tests/cancel', {
				testID: test._id,
				cartridgeID: test._cartridge._id,
				deviceID: test._device._id,
				deviceName: test._device.name
			}).
				success(function(data, status, headers, config) {
					test.status = 'Cancelled';
					Notification.success('Test cancelled');
				}).
				error(function(err, status, headers, config) {
					Notification.error(err.message);
				});
		};
	}
]);

'use strict';

var _ = window._;
var c3 = window.c3;
var d3 = window.d3;

// Tests controller
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', '$location', 'Authentication', 'Tests', 'Notification',
  function($scope, $http, $location, Authentication, Tests, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
			$location.path('/signin');
		}

    $scope.loadGraph = function(index) {
      var test = $scope.tests[index];
      var a = test.analysis;
      var std = test.standardCurve;
      var cuts = [a.redMin, a.greenMin, a.greenMax, a.redMax];

      var xs = _.pluck(std, 'x');
      var ys = _.pluck(std, 'y');
      var standardScale = d3.scale.linear().domain(xs).range(ys);
      var resultY = standardScale(test._cartridge.value);

      xs.splice(0, 0, 'Standard Curve X');
      ys.splice(0, 0, 'Standard Curve');

      var chart = c3.generate({
          bindto: '#testgraph' + index,
          padding: {
              top: 10,
              right: 40,
              bottom: 10,
              left: 30,
          },
          data: {
            xs: {
              'Standard Curve': 'Standard Curve X',
              'This Test': 'This Test X'
            },
            columns: [
              xs, ['This Test X', test._cartridge.value],
              ys, ['This Test', resultY]
            ],
            type: 'spline',
            axes: {
              'Standard Curve': 'y'
            }
          },
          zoom: {
            enabled: true
          },
          point: {
            r: function(d) {
                if (d.id === 'This Test') {
                  return 10;
                }
                else {
                  return 1;
                }
              }
          },
          legend: {
            position: 'bottom'
          },
          axis: {
            x1: {
              label: 'Standard Curve',
              type: 'linear',
              count: 8
            },
            x2: {
              label: 'This Test',
              type: 'linear',
              count: 8
            },
            y: {
              label: 'Test Results'
            }
          },
          regions: [
            {axis: 'y', end: cuts[0], class: 'positive'},
            {axis: 'y', start: cuts[0], end: cuts[1], class: 'borderline'},
            {axis: 'y', start: cuts[1], end: cuts[2], class: 'negative'},
            {axis: 'y', start: cuts[2], end: cuts[3], class: 'borderline'},
            {axis: 'y', start: cuts[3], class: 'positive'}
          ]
      });
    };

    $scope.currentPage = 0;
		$scope.pageChanged = function() {
			$scope.load();
		};

		$scope.load = function() {
	      $http.post('/tests/load', {
					page: $scope.currentPage,
					pageSize: $scope.itemsPerPage
				}).
					success(function(data, status, headers, config) {
						$scope.tests = data.tests;
            $scope.totalItems = data.total_count;
				  }).
				  error(function(err, status, headers, config) {
						console.log(err);
						Notification.error(err.message);
				  });
		};
  }
]);

'use strict';

var _ = window._;
var $ = window.$;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', '$modal', '$window','Authentication', 'Tests', 'Notification', 'Socket',
  function($scope, $http, $location, $modal, $window, Authentication, Tests, Notification, Socket) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    Socket.on('test.update', function(message) {
      var data = message.split('\n');
        if (data[0] === 'Test complete' || data[2] === '-1') {
          $scope.loadDevices();
        }
      });

    $scope.setupRun = function() {
      $scope.loadDevices();
      $scope.reference = '';
      $scope.subject = '';
      $scope.description = '';
      $scope.cartridge = {};
      $scope.assay = {};
    };

    $scope.refreshDevices = function() {
      console.log('Refreshing device list');
      $http.post('/devices/release').
      success(function(data, status, headers, config) {
        $scope.devices = data;
        $scope.activeDevice = -1;
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    $scope.rescanCartridge = function() {
      Notification.info('Rescanning cartridge, please wait...');
      $http.post('/devices/rescan_cartridge', {
        deviceID: $scope.devices[$scope.activeDevice]._id
      }).
      success(function(data, status, headers, config) {
        $scope.cartridge = data.cartridge;
        $scope.assay = data.assay;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.loadDevices = function() {
      $http.get('/devices/available').
        success(function(data, status, headers, config) {
          $scope.devices = data;
          $scope.activeDevice = -1;
      }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
    };

    $scope.claimDevice = function(indx) {
      if (indx !== $scope.activeDevice) {
        Notification.info('Setting up device, please wait...');
        $scope.activeDevice = indx;
        $http.post('/devices/claim', {
          currentDeviceID: $scope.activeDevice === -1 ? '' : $scope.devices[$scope.activeDevice]._id,
          newDeviceID: $scope.devices[indx]._id
        }).
        success(function(data, status, headers, config) {
          $scope.devices[indx].claimed = true;
          $scope.cartridge = data.cartridge;
          $scope.assay = data.assay;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
          $scope.activeDevice = -1;
        });
      }
    };

    $scope.beginTest = function() {
      var device;
      if (!$scope.reference) {
        Notification.error('You must enter a reference number');
      }
      else {
        if ($scope.activeDevice !== -1) {
          Notification.success('Starting test, please wait...');
          device = $scope.devices[$scope.activeDevice];
          $http.post('/tests/begin', {
            reference: $scope.reference,
            subject: $scope.subject,
            description: $scope.description,
            deviceID: device._id,
            deviceName: device.name,
            assayID: $scope.assay._id,
            assayName: $scope.assay.name,
            cartridgeID: $scope.cartridge._id
          }).
          success(function(data, status, headers, config) {
            $scope.setupRun();
          }).
          error(function(err, status, headers, config) {
            console.log(err);
            Notification.error(err.message);
          });
        }
      }
    };
  }
]);

'use strict';

// Tests controller
angular.module('tests').controller('TestsController', ['$scope', '$stateParams', '$location', '$http', '$window', 'Authentication', 'Tests', 'Assays',
  function($scope, $stateParams, $location, $http, $window, Authentication, Tests, Assays) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      $location.path('/signin');
    }

    $scope.showResultsOnOpen = true;

    // Create new Test
    $scope.create = function() {
      // Create new Test object
      var test = new Tests({
        reference: this.reference,
        subject: this.subject,
        description: this.description
      });

      // Redirect after save
      test.$save(function(response) {
        $location.path('tests');

        // Clear form fields
        $scope.reference = '';
        $scope.subject = '';
        $scope.description = '';
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Test
    $scope.remove = function(test) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (test) {
          test.$remove();

          for (var i in $scope.tests) {
            if ($scope.tests[i] === test) {
              $scope.tests.splice(i, 1);
            }
          }
        } else {
          $scope.test.$remove(function() {
            $location.path('tests');
          });
        }
      }
    };

    // Update existing Test
    $scope.update = function() {
      var test = new Tests($scope.test);

      test.$update(function() {
        $location.path('tests');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Tests
    $scope.find = function() {
      $scope.tests = Tests.query();
    };

    // Find existing Test
    $scope.findOne = function() {
      $scope.test = Tests.get({
        testId: $stateParams.testId
      });
    };
  }
]);

'use strict';

//Tests service used to communicate Tests REST endpoints
angular.module('tests').factory('Tests', ['$resource',
	function($resource) {
		return $resource('tests/:testId', { testId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function($q, $location, Authentication) {
				return {
					responseError: function(rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour 
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);
'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('profile', {
			url: '/settings/profile',
			templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
		}).
		state('password', {
			url: '/settings/password',
			templateUrl: 'modules/users/views/settings/change-password.client.view.html'
		}).
		state('accounts', {
			url: '/settings/accounts',
			templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
		}).
		state('signup', {
			url: '/signup',
			templateUrl: 'modules/users/views/authentication/signup.client.view.html'
		}).
		state('signin', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
		state('forgot', {
			url: '/password/forgot',
			templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
		}).
		state('reset-invalid', {
			url: '/password/reset/invalid',
			templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
		}).
		state('reset-success', {
			url: '/password/reset/success',
			templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
		}).
		state('reset', {
			url: '/password/reset/:token',
			templateUrl: 'modules/users/views/password/reset-password.client.view.html'
		});
	}
]);
'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.alerts = [];

		$scope.addAlert = function (message, type) {
			$scope.alerts.push({msg: message, type: type});
		};

		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};

		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
                $scope.addAlert($scope.error, 'danger');
			});
		};

		$scope.signin = function() {
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
                $scope.addAlert($scope.error, 'danger');
			});
		};
	}
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Organizations', 'Authentication',
	function($scope, $http, $location, Users, Organizations, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		$scope.organizations = Organizations.query();
		$scope.selectOrganization = function(indx) {
			$scope.user._organization = $scope.organizations[indx]._id;
		};

		// Check if there are additional accounts
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}
			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
					$location.path('/');
					/*global swal */
					swal({title: '', text: '<b>' + $scope.user.firstName + ' ' + $scope.user.lastName +  ' has been updated!</b>', type: 'success', confirmButtonColor: '#5cb85c', html: true});
				}, function(response) {
					/*global swal */
					swal({title: '', text: '<b>' + response.data.message + '</b>', type: 'error', confirmButtonColor: 'rgb(242,116,116)', html: true});
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
				$location.path('/');
				/*global swal */
				swal({title: '', text: '<b>' + Authentication.user.firstName + ' ' + Authentication.user.lastName +  '\'s password has been updated!</b>', type: 'success', confirmButtonColor: '#5cb85c', html: true});
			}).error(function(response) {
				/*global swal */
				swal({title: '', text: '<b>' + response.message + '</b>', type: 'error', confirmButtonColor: 'rgb(242,116,116)', html: true});
			});
		};
	}
]);

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', [
	function() {
		var _this = this;

		_this._data = {
			user: window.user
		};

		return _this._data;
	}
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
