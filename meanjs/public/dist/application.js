'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'brevitest';
	var applicationModuleVendorDependencies = ['ngResource', 'ngCookies',  'ngAnimate',  'ngTouch',  'ngSanitize',  'ui.router', 'ui.bootstrap', 'ui.utils', 'ui-notification', 'btford.socket-io'];

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
ApplicationConfiguration.registerModule('devices');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('healthcare-providers');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('manufacturers');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('prescriptions');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('sparks');
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
      Notification.error('You must sign in to use Brevitest™');
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
      if ($window.confirm('Are you sure you want to delete this record?')) {
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
		var c, indx = e.indexOf(',');
		if (indx === -1) {
			c = e;
		}
		else {
			c = e.substring(0, indx);
		}
		result += bcode[c] + '  [ ' + (indx !== -1 ? e.substring(indx + 1) : e) + ' ]<br/>';
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
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

		$scope.showResultsOnOpen = true;

		// Create new Cartridge
		$scope.create = function() {
			// Create new Cartridge object
			var cartridge = new Cartridges ({
				name: this.name
			});

			// Redirect after save
			cartridge.$save(function(response) {
				$location.path('cartridges/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
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
			var cartridge = $scope.cartridge;

			cartridge.$update(function() {
				$location.path('cartridges/' + cartridge._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Cartridges
		$scope.find = function() {
			$scope.cartridges = Cartridges.query();
		};

		$scope.currentPage = 0;

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
		Menus.addMenuItem('topbar', 'View', 'view', 'dropdown', '');
		Menus.addSubMenuItem('topbar', 'view', 'Assays', 'assays');
		Menus.addSubMenuItem('topbar', 'view', 'Devices', 'devices');
		Menus.addSubMenuItem('topbar', 'view', 'Device Models', 'device-models');
		Menus.addSubMenuItem('topbar', 'view', 'Prescriptions', 'prescriptions');
		Menus.addSubMenuItem('topbar', 'view', 'Sparks', 'sparks');

		Menus.addMenuItem('topbar', 'Create', 'new', 'dropdown', '');
		Menus.addSubMenuItem('topbar', 'new', 'Assay', 'assays/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device', 'devices/create');
		Menus.addSubMenuItem('topbar', 'new', 'Device Model', 'device-models/create');
		Menus.addSubMenuItem('topbar', 'new', 'Prescription', 'prescriptions/create');
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
	}
]);

'use strict';


angular.module('core').controller('HomeController', ['$scope', '$location', 'Authentication', 'Notification',
	function($scope, $location, Authentication, Notification) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
		if (!$scope.authentication.user) {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

		$scope.showDetail = false;
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
angular.module('device-models').controller('DeviceModelsController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'DeviceModels', 'Devices',
  function($scope, $http, $stateParams, $location, $window, Authentication, DeviceModels, Devices) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
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
        $location.path('device-models/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.reference = '';
        $scope.description = '';
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
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
      var deviceModel = $scope.deviceModel;

      deviceModel.$update(function() {
        $location.path('device-models/' + deviceModel._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
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
angular.module('devices').controller('DevicesController', ['$scope', '$http', '$stateParams', '$location', '$window', 'Authentication', 'Devices', 'DeviceModels', 'Sparks', 'Notification',
  function($scope, $http, $stateParams, $location, $window, Authentication, Devices, DeviceModels, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    $scope.loadData = function() {
      $scope.deviceModels = DeviceModels.query();
      $scope.sparks = Sparks.query();
    };

    $scope.moveToAndSetCalibrationPoint = function() {
      $http.post('/devices/move_to_and_set_calibration_point', {
        device: $scope.device
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        Notification.success(data.result);
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
    $scope.spark = {};

    $scope.openedMfg = false;
    $scope.openedReg = false;
    $scope.minRegDate = $scope.manufacturedOn;

    $scope.setRegMinDate = function() {
      $scope.minRegDate = $scope.manufacturedOn;
    };

    $scope.selectDeviceModel = function(id) {
      $scope.deviceModel._id = id;
    };

    $scope.selectSpark = function(id) {
      $scope.spark._id = id;
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
        _spark: this.spark._id
      });

      // Redirect after save
      device.$save(function(response) {
        $location.path('devices/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.serialNumber = '';
        $scope.calibrationSteps = '';
        $scope.status = '';
        $scope.manufacturedOn = '';
        $scope.registeredOn = '';
        $scope.deviceModel = {};
        $scope.spark = {};
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
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
      var device = $scope.device;
      device._deviceModel = $scope.deviceModel ? $scope.deviceModel._id : '';
      device._spark = $scope.spark ? $scope.spark._id : '';

      device.$update(function() {
        $location.path('devices/' + device._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
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
        $scope.sparks = $scope.sparks || Sparks.query();
        $scope.online = $scope.device._spark.connected;
        $scope.setOnlineButtonText();
        $scope.deviceModel = $scope.device._deviceModel ? $scope.device._deviceModel : {};
        $scope.spark = $scope.device._spark ? $scope.device._spark : {};
      });
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
angular.module('healthcare-providers').config(['$stateProvider',
	function($stateProvider) {
		// Healthcare providers state routing
		$stateProvider.
		state('listHealthcareProviders', {
			url: '/healthcare-providers',
			templateUrl: 'modules/healthcare-providers/views/list-healthcare-providers.client.view.html'
		}).
		state('createHealthcareProvider', {
			url: '/healthcare-providers/create',
			templateUrl: 'modules/healthcare-providers/views/create-healthcare-provider.client.view.html'
		}).
		state('viewHealthcareProvider', {
			url: '/healthcare-providers/:healthcareProviderId',
			templateUrl: 'modules/healthcare-providers/views/view-healthcare-provider.client.view.html'
		}).
		state('editHealthcareProvider', {
			url: '/healthcare-providers/:healthcareProviderId/edit',
			templateUrl: 'modules/healthcare-providers/views/edit-healthcare-provider.client.view.html'
		});
	}
]);
'use strict';

// Healthcare providers controller
angular.module('healthcare-providers').controller('HealthcareProvidersController', ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'HealthcareProviders',
  function($scope, $stateParams, $location, $window, Authentication, HealthcareProviders) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    $scope.addresses = [];
    $scope.addressTypes = ['Main', 'Business', 'Clinic', 'Other'];
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

    // Create new Healthcare provider
    $scope.create = function() {
      // Create new Healthcare provider object
      var healthcareProvider = new HealthcareProviders({
        name: this.name,
        addresses: this.addresses
      });

      // Redirect after save
      healthcareProvider.$save(function(response) {
        $location.path('healthcare-providers/' + response._id);

        // Clear form fields
        $scope.name = '';
        $scope.addresses = [];
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Healthcare provider
    $scope.remove = function(healthcareProvider) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (healthcareProvider) {
          healthcareProvider.$remove();

          for (var i in $scope.healthcareProviders) {
            if ($scope.healthcareProviders[i] === healthcareProvider) {
              $scope.healthcareProviders.splice(i, 1);
            }
          }
        } else {
          $scope.healthcareProvider.$remove(function() {
            $location.path('healthcare-providers');
          });
        }
      }
    };

    // Update existing Healthcare provider
    $scope.update = function() {
      var healthcareProvider = $scope.healthcareProvider;

      healthcareProvider.addresses = $scope.addresses;
      healthcareProvider.$update(function() {
        $location.path('healthcare-providers/' + healthcareProvider._id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Healthcare providers
    $scope.find = function() {
      $scope.healthcareProviders = HealthcareProviders.query();
    };

    // Find existing Healthcare provider
    $scope.findOne = function() {
      $scope.healthcareProvider = HealthcareProviders.get({
        healthcareProviderId: $stateParams.healthcareProviderId
      }, function() {
        $scope.addresses = $scope.healthcareProvider.addresses.length ? $scope.healthcareProvider.addresses : $scope.addresses;
      });
    };
  }
]);

'use strict';

//Healthcare providers service used to communicate Healthcare providers REST endpoints
angular.module('healthcare-providers').factory('HealthcareProviders', ['$resource',
	function($resource) {
		return $resource('healthcare-providers/:healthcareProviderId', { healthcareProviderId: '@_id'
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
      Notification.error('You must sign in to use Brevitest™');
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
        $location.path('manufacturers/' + response._id);

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
      var manufacturer = $scope.manufacturer;

      manufacturer.addresses = $scope.addresses;
      manufacturer.$update(function() {
        $location.path('manufacturers/' + manufacturer._id);
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
angular.module('prescriptions').config(['$stateProvider',
	function($stateProvider) {
		// Prescriptions state routing
		$stateProvider.
		state('listPrescriptions', {
			url: '/prescriptions',
			templateUrl: 'modules/prescriptions/views/list-prescriptions.client.view.html'
		}).
		state('createPrescription', {
			url: '/prescriptions/create',
			templateUrl: 'modules/prescriptions/views/create-prescription.client.view.html'
		}).
		state('viewPrescription', {
			url: '/prescriptions/:prescriptionId',
			templateUrl: 'modules/prescriptions/views/view-prescription.client.view.html'
		}).
		state('editPrescription', {
			url: '/prescriptions/:prescriptionId/edit',
			templateUrl: 'modules/prescriptions/views/edit-prescription.client.view.html'
		});
	}
]);

'use strict';

var _ = window._;

// Prescriptions controller
angular.module('prescriptions').controller('PrescriptionsController', ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'Prescriptions', 'Assays',
  function($scope, $stateParams, $location, $window, Authentication, Prescriptions, Assays) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    $scope.openedPres = false;
    $scope.openedDOB = false;

    $scope.prescriptionAssays = [];
    $scope.assays = Assays.query();
    $scope.prescribedOn = new Date();

    $scope.openDatepicker = function($event, dateField) {
      $event.preventDefault();
      $event.stopPropagation();

      switch (dateField) {
        case 'pres':
          $scope.openedPres = !$scope.openedPres;
          break;
        case 'dob':
          $scope.openedDOB = !$scope.openedDOB;
          break;
      }
    };

    function assaySort(a, b) {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    }

    $scope.prescribeAssay = function(id) {
      var indx = _.findIndex($scope.prescriptionAssays, function(e) {
        return (e._id === id);
      });
      if (indx === -1) {
        indx = _.findIndex($scope.assays, function(e) {
          return (e._id === id);
        });
        $scope.prescriptionAssays.push($scope.assays[indx]);
        $scope.assays.splice(indx, 1);
        $scope.prescriptionAssays.sort(assaySort);
        $scope.assays.sort(assaySort);
      }
    };

    $scope.removePrescribedAssay = function(id) {
      var indx = _.findIndex($scope.prescriptionAssays, function(e) {
        return (e._id === id);
      });
      $scope.assays.push($scope.prescriptionAssays[indx]);
      $scope.prescriptionAssays.splice(indx, 1);
      $scope.prescriptionAssays.sort(assaySort);
      $scope.assays.sort(assaySort);
    };

    // Create new Prescription
    $scope.create = function() {
      // Create new Prescription object
      var prescription = new Prescriptions({
        name: this.name,
        prescribedOn: this.prescribedOn,
        comments: this.comments,
        patientNumber: this.patientNumber,
        patientGender: this.patientGender,
        patientDateOfBirth: this.patientDateOfBirth,
        _assays: _.pluck(this.prescriptionAssays, '_id')
      });

      // Redirect after save
      prescription.$save(function(response) {
        $location.path('#!');
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Prescription
    $scope.remove = function(prescription) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (prescription) {
          prescription.$remove();

          for (var i in $scope.prescriptions) {
            if ($scope.prescriptions[i] === prescription) {
              $scope.prescriptions.splice(i, 1);
            }
          }
        } else {
          $scope.prescription.$remove(function() {
            $location.path('prescriptions');
          });
        }
      }
    };

    // Update existing Prescription
    $scope.update = function() {
      var prescription = $scope.prescription;
      prescription._assays = _.pluck($scope.prescriptionAssays, '_id');
      console.log(prescription);
      prescription.$update(function() {
        $location.path('/prescriptions/' + prescription._id);
        console.log(prescription);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Prescriptions
    $scope.find = function() {
      $scope.prescriptions = Prescriptions.query();
    };

    // Find existing Prescription
    $scope.findOne = function() {
      $scope.prescription = Prescriptions.get({
        prescriptionId: $stateParams.prescriptionId
      }, function() {
        if ($scope.prescription._assays && $scope.prescription._assays.length) {
          $scope.prescription._assays.forEach(function(e) {
            $scope.prescribeAssay(e._id);
          });
        }
      });
    };
  }
]);

'use strict';

//Prescriptions service used to communicate Prescriptions REST endpoints
angular.module('prescriptions').factory('Prescriptions', ['$resource',
	function($resource) {
		return $resource('prescriptions/:prescriptionId', { prescriptionId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('sparks').config(['$stateProvider',
	function($stateProvider) {
		// Sparks state routing
		$stateProvider.
		state('listSparks', {
			url: '/sparks',
			templateUrl: 'modules/sparks/views/list-sparks.client.view.html'
		}).
		state('createSpark', {
			url: '/sparks/create',
			templateUrl: 'modules/sparks/views/create-spark.client.view.html'
		}).
		state('viewSpark', {
			url: '/sparks/:sparkId',
			templateUrl: 'modules/sparks/views/view-spark.client.view.html'
		}).
		state('editSpark', {
			url: '/sparks/:sparkId/edit',
			templateUrl: 'modules/sparks/views/edit-spark.client.view.html'
		});
	}
]);

'use strict';

// Sparks controller
angular.module('sparks').controller('SparksController', ['$scope', '$http', '$stateParams', '$location', '$timeout', '$window', 'Authentication', 'Sparks', 'Notification',
  function($scope, $http, $stateParams, $location, $timeout, $window, Authentication, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    $scope.eraseArchivedData = function() {
      $http.post('/sparks/erase_archived_data', {
        spark: $scope.spark
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        if (data.return_value === 1) {
          Notification.success('Archive erased');
        }
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });
    };

    $scope.getNumberOfRecords = function() {
      $http.post('/sparks/archive_size', {
        spark: $scope.spark
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        if (data.return_value !== -1) {
          Notification.success('Archive contains ' + data.return_value + ' records');
        }
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });
    };

    $scope.getFirstRecord = function() {
      $http.post('/sparks/record_by_index', {
        spark: $scope.spark,
        index: 0
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.rawData = JSON.parse(data);
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });
    };

    $scope.reflash = function() {
      $http.post('/sparks/reflash', {
        spark: $scope.spark
      }).
      success(function(data, status, headers, config) {
        Notification.success('Firmware flashed successfully');
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    // Create new Spark
    $scope.create = function() { // Create new Spark object
      var spark = new Sparks({
        name: this.name,
        sparkID: this.sparkID
      });

      // Redirect after save
      spark.$save(
        function(response) {
          $location.path('sparks/' + response._id);

          // Clear form fields
          $scope.name = '';
          $scope.sparkID = '';
        },
        function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });
    };

    // Remove existing Spark
    $scope.remove = function(spark) {
      if ($window.confirm('Are you sure you want to delete this record?')) {
        if (spark) {
          spark.$remove();

          for (var i in $scope.sparks) {
            if ($scope.sparks[i] === spark) {
              $scope.sparks.splice(i, 1);
            }
          }
        } else {
          $scope.spark.$remove(function() {
            $location.path('sparks');
          });
        }
      }
    };

    // Update existing Spark
    $scope.update = function() {
      var spark = $scope.spark;

      spark.$update(
        function() {
          $location.path('sparks/' + spark._id);
        },
        function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });
    };

    // Refresh a list of Sparks
    $scope.refresh = function() {
      console.log('Refreshing device list');
      $http.get('/sparks/refresh').
      success(function(data, status, headers, config) {
        $scope.sparks = data;
        Notification.success('Spark list refreshed');
        // addAlert($scope.alerts, 'success', 'Spark list refreshed');
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    // Find a list of Sparks
    $scope.find = function() {
      $scope.sparks = Sparks.query();
    };

    // Find existing Spark
    $scope.findOne = function() {
      $scope.spark = Sparks.get({
        sparkId: $stateParams.sparkId
      });
    };
  }
]);

'use strict';

var sparkSensorHeader = '<thead><tr><th>Sensor</th><th>Type</th><th>Reading Date<br/>Reading Time</th><th>Red</th><th>Green</th><th>Blue</th></tr></thead><tbody>';

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

function parse_sensor_reading(str) {
	var data = str.split('\t');
	var result = '<tr><td>' + (data[0] === 'A' ? 'Assay' : 'Control');
	result += '<td>' + (parseInt(data[1], 10) ? 'Result' : 'Baseline');
  result += '<td>' + string_to_datetime_string(data[2]);
	result += '<td>' + parseInt(data[3], 10);
	result += '<td>' + parseInt(data[4], 10);
	result += '<td>' + parseInt(data[5], 10) + '</tr>';
	return result;
}

function parse_test_header(str) {
	var data = str.split('\t');
	var result = '<strong>TEST INFORMATION</strong><br/>';
	result += 'Record number: ' + data[0] + '<br/>';
	result += 'Test start time: ' + string_to_datetime_string(data[1], ' - ') + '<br/>';
	result += 'Test finish time: ' + string_to_datetime_string(data[2], ' - ') + '<br/>';
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
	result += '<div class="table-responsive"><table class="table table-striped">' + sparkSensorHeader;
	for (i = 2; i < 6; i += 1) {
		result += parse_sensor_reading(data[i]);
	}
	result += '</tbody></table></div>';

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

'use strict';

//Sparks service used to communicate Sparks REST endpoints
angular.module('sparks').factory('Sparks', ['$resource',
	function($resource) {
		return $resource('sparks/:sparkId', { sparkId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
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
angular.module('tests').controller('MonitorTestController', ['$scope', '$http', '$timeout', '$location', 'Authentication', 'Tests', 'Notification', 'Socket',
	function($scope, $http, $timeout, $location, Authentication, Tests, Notification, Socket) {
		$scope.authentication = Authentication;
		if (!$scope.authentication || $scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
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
			  }).
			  error(function(err, status, headers, config) {
					Notification.error(err.message);
			  });


			Socket.on('test.update', function(message) {
				var data = message.split('\n');
				$scope.tests.forEach(function(e, i) {
					if (e._cartridge._id === data[1]) {
						e.percentComplete = parseInt(data[2]);
						e.status = data[0].length ? data[0] : e.status;
					}
				});
			});
		};

		$scope.cancelTest = function(index) {
			var test = $scope.tests[index];

			$http.post('/tests/cancel', {
				testID: test._id,
				cartridgeID: test._cartridge._id,
				deviceID: test._device._id
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
angular.module('tests').controller('ReviewTestController', ['$scope', '$http', '$location', 'Authentication', 'Tests', 'Sparks', 'Notification',
  function($scope, $http, $location, Authentication, Tests, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
			Notification.error('You must sign in to use Brevitest™');
			$location.path('/signin');
		}

    $scope.loadGraph = function(index) {
      var test = $scope.tests[index];
      var a = test._assay.analysis;
      var std = test._assay.standardCurve;
      var cuts = [a.redMin, a.greenMin, a.greenMax, a.redMax];

      var xs = _.pluck(std, 'x');
      var ys = _.pluck(std, 'y');
      var standardScale = d3.scale.linear().domain(xs).range(ys);
      var resultY = standardScale(test._cartridge.result);

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
              xs, ['This Test X', test._cartridge.result],
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

    $scope.updateTest = function(index) {
      var test = $scope.tests[index];
      var body = {
        testID: test._id,
        cartridgeID: test._cartridge._id,
        deviceID: test._device._id,
        analysis: test._assay.analysis,
        standardCurve: test._assay.standardCurve,
        percentComplete: test.percentComplete,
        state: test.status
      };
      $http.post('/tests/update_one_test', body).
      success(function(data, status, headers, config) {
        test.reading = data.reading;
        test.result = data.result;
        test.startedOn = Date(data.startedOn);
        test.finishedOn = Date(data.finishedOn);
        test.percentComplete = data.percentComplete;

        test._cartridge.rawData = data.rawData;
        test._cartridge.result = data.value;
        test._cartridge.startedOn = Date(data.startedOn);
        test._cartridge.finishedOn = Date(data.finishedOn);
        test._cartridge.failed = data.failed;
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
      Notification.success('Test record updating');
    };

    $scope.loadRawData = function(cartridgeID) {
      $http.post('/sparks/record_by_cartridge_id', {
        cartridgeID: cartridgeID
      }).
      success(function(data, status, headers, config) {
        $scope.tests.forEach(function(e) {
          if (e._cartridge._id === cartridgeID) {
            e._cartridge.rawData = JSON.parse(data);
          }
        });
      }).
      error(function(err, status, headers, config) {
        Notification.error(err.message);
      });
      Notification.info('Loading data from device');
    };
  }
]);

'use strict';

var _ = window._;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', '$modal', 'Authentication', 'Tests', 'Prescriptions', 'Devices', 'Cartridges', 'Sparks', 'Notification',
  function($scope, $http, $location, $modal, Authentication, Tests, Prescriptions, Devices, Cartridges, Sparks, Notification) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    function loadAssays(prescription) {
      var tests = _.pluck(prescription._tests, '_assay');
      $scope.pendingAssays = [];
      $scope.completedAssays = [];
      prescription._assays.forEach(function(a) {
        var indx = tests.indexOf(a._id);
        if (indx === -1) {
          $scope.pendingAssays.push(a);
        } else {
          $scope.completedAssays.push(a);
        }
      });
    }

    $scope.refresh = function() {
      console.log('Refreshing device list');
      $http.get('/sparks/refresh').
      success(function(data, status, headers, config) {
        Notification.success('Spark list refreshed');
        $scope.setupRun();
        // addAlert($scope.alerts, 'success', 'Spark list refreshed');
      }).
      error(function(err, status, headers, config) {
        console.log(err, status, headers(), config);
        Notification.error(err.message);
      });
    };

    $scope.setupRun = function() {
      $scope.testUnderway = false;
      $scope.activePrescription = -1;
      $scope.activeAssay = -1;
      $scope.deviceInitialized = false;
      $scope.activeDevice = -1;
      $scope.activeCartridge = -1;
      $http.get('/prescriptions/unfilled').
      success(function(data, status, headers, config) {
        $scope.prescriptions = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
      $http.get('/devices/available').
      success(function(data, status, headers, config) {
        $scope.devices = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    var currentPrescription = -1;
    $scope.clickPrescription = function(indx) {
      if (currentPrescription !== indx) {
        $scope.activeAssay = -1;
        $scope.activePrescription = -1;
        loadAssays($scope.prescriptions[indx]);
      }
      currentPrescription = indx;
    };
    $scope.clickAssay = function(indx) {
      $scope.activePrescription = currentPrescription;
      $scope.activeAssay = indx;
      $http.post('/cartridges/unused', {
        assayID: $scope.pendingAssays[$scope.activeAssay]._id
      }).
      success(function(data, status, headers, config) {
        $scope.cartridges = data;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };
    $scope.clickDevice = function(indx) {
      $scope.activeDevice = indx;
    };
    $scope.clickCartridge = function(indx) {
      $scope.activeCartridge = indx;
    };

    $scope.initializeDevice = function() {
      if ($scope.activeDevice < 0) {
        Notification.error('Please select a device to initialize');
        return;
      }
      if (!$scope.devices[$scope.activeDevice]) {
        Notification.error('Unknown device');
        return;
      }
      $scope.testUnderway = false;
      $http.post('/devices/initialize', {
        device: $scope.devices[$scope.activeDevice]
      }).
      success(function(data, status, headers, config) {
        $scope.deviceInitialized = true;
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        $scope.deviceInitialized = false;
        Notification.error(err.message);
      });

      Notification.success('Initialization started');
    };

    $scope.beginTest = function() {
      if ($scope.activePrescription < 0 || $scope.activeAssay < 0) {
        Notification.error('Please select an assay for testing');
        return;
      }
      if ($scope.activeDevice < 0) {
        Notification.error('Please select a device for testing');
        return;
      }
      if ($scope.activeCartridge < 0) {
        Notification.error('Please select a cartridge for testing');
        return;
      }
      if (!$scope.pendingAssays[$scope.activeAssay]) {
        Notification.error('Unknown assay');
        return;
      }
      if (!$scope.devices[$scope.activeDevice]) {
        Notification.error('Unknown device');
        return;
      }
      if (!$scope.cartridges[$scope.activeCartridge]) {
        Notification.error('Unknown cartridge');
        return;
      }
      var assay = $scope.pendingAssays[$scope.activeAssay];
      var cartridge = $scope.cartridges[$scope.activeCartridge];
      var device = $scope.devices[$scope.activeDevice];
      var prescription = $scope.prescriptions[$scope.activePrescription];
      $http.post('/tests/begin', {
        assayID: assay._id,
        assayName: assay.name,
        assayBCODE: assay.BCODE,
        analysis: assay.analysis,
        standardCurve: assay.standardCurve,
        cartridgeID: cartridge._id,
        deviceID: device._id,
        deviceName: device.name,
        prescriptionID: prescription._id
      }).
      success(function(data, status, headers, config) {
        Notification.success('Test underway');
        $scope.testUnderway = true;
        $http.post('/cartridges/unused', {
          assayID: assay._id
        }).
        success(function(data, status, headers, config) {
          $scope.cartridges = data;
        }).
        error(function(err, status, headers, config) {
          console.log(err);
          Notification.error(err.message);
        });
      }).
      error(function(err, status, headers, config) {
        console.log(err);
        Notification.error(err.message);
      });
    };

    $scope.userMediaExists = !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || navigator.msGetUserMedia);
    console.log('UserMedia exists?', $scope.userMediaExists);

    $scope.setupModal = function() {
      return;
    };

    $scope.scanCartridge = function() {
      var modalInstance = $modal.open({
        templateUrl: 'modules/tests/views/scan-cartridge-modal.view.html',
        controller: 'ScanCartridgeModalInstanceController',
        size: 'sm',
        scope: $scope,
        resolve: {
          userMediaExists: function() {
            return $scope.userMediaExists;
          }
        }
      });

			modalInstance.opened.then(function() {
				if ($scope.userMediaExists) {
			    $scope.canvas = document.getElementById('canvas');
					$scope.context = $scope.canvas.getContext('2d');
					$scope.video = document.getElementById('video');
					$scope.videoObj = {video: true};
					var errBack = function(error) {
			        console.log('Video capture error: ', error.code);
			      };

			    // Put video listeners into place
			    if (navigator.getUserMedia) { // Standard
			      navigator.getUserMedia($scope.videoObj, function(stream) {
							$scope.video.src = stream;
							$scope.video.play();
			      }, errBack);
			    } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
			      navigator.webkitGetUserMedia($scope.videoObj, function(stream) {
							$scope.video.src = window.webkitURL.createObjectURL(stream);
							$scope.video.play();
			      }, errBack);
			    } else if (navigator.mozGetUserMedia) { // Firefox-prefixed
			      navigator.mozGetUserMedia($scope.videoObj, function(stream) {
							$scope.video.src = window.URL.createObjectURL(stream);
							$scope.video.play();
			      }, errBack);
			    }
			  }
			});

      modalInstance.result.then(function(result) {
        console.log(result);
      }, function() {
        console.log('Modal dismissed at: ' + new Date());
      });
    };

  }
]);

angular.module('tests').controller('ScanCartridgeModalInstanceController', ["$scope", "$modalInstance", "userMediaExists", function($scope, $modalInstance, userMediaExists) {

  $scope.snapPhoto = function() {
    if (userMediaExists) {
      $scope.context.drawImage($scope.video, 0, 0, 640, 480);
    }
  };

  $scope.ok = function() {
    $modalInstance.close('result');
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };
}]);

'use strict';

// Tests controller
angular.module('tests').controller('TestsController', ['$scope', '$stateParams', '$location', '$http', '$window', 'Authentication', 'Tests', 'Assays',
  function($scope, $stateParams, $location, $http, $window, Authentication, Tests, Assays) {
    $scope.authentication = Authentication;
    if (!$scope.authentication || $scope.authentication.user === '') {
      Notification.error('You must sign in to use Brevitest™');
      $location.path('/signin');
    }

    $scope.showResultsOnOpen = true;

    // Create new Test
    $scope.create = function() {
      // Create new Test object
      var test = new Tests({
        name: this.name,
        description: this.description
      });

      // Redirect after save
      test.$save(function(response) {
        $location.path('tests/' + response._id);

        // Clear form fields
        $scope.name = '';
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
      var test = $scope.test;

      test.$update(function() {
        $location.path('tests/' + test._id);
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

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

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
				}, function(response) {
					$scope.error = response.data.message;
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
			}).error(function(response) {
				$scope.error = response.message;
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