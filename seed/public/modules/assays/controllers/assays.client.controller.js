'use strict';

// Assays controller
angular.module('assays').controller('AssaysController', ['$scope', '$log', '$stateParams', '$location', 'Authentication', 'Assays',
	function($scope, $log, $stateParams, $location, Authentication, Assays) {
		$scope.authentication = Authentication;

		$scope.BCODE = [];
		$scope.BCODEActions = [

			{
				name:'Move Up'
			},
			{
				name:'Move Down'
			},
			{
				name:'Edit'
			},
			{
				name:'Delete'
			}
		];
		$scope.selected_action = 	{name:'--Choose Action--'};
		$scope.doBCODEAction = function(sel) {
			switch (sel.name) {
				case 'Move Up':
					$log.log(sel.name);
					break;
				case 'Move Down':
					$log.log(sel.name);
					break;
				case 'Edit':
					$log.log(sel.name);
					break;
				case 'Delete':
					$log.log(sel.name);
					break;
			}
		};
		$scope.BCODECommands = [
			{
				num: '0',
				name: 'Start Test',
				description: 'Starts the test. Required to be the first command. Test executes until Finish Test command. Parameters are (sensor integration time, sensor gain).'
			},
			{
				num: '1',
				name: 'Delay',
				description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'
			},
			{
				num: '2',
				name: 'Move',
				description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'
			},
			{
				num: '3',
				name: 'Solenoid On',
				description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'
			},
			{
				num: '4',
				name: 'Device LED On',
				description: 'Turns on the device LED, which is visible outside the device. No parameters.'
			},
			{
				num: '5',
				name: 'Device LED Off',
				description: 'Turns off the device LED. No parameters.'
			},
			{
				num: '6',
				name: 'Device LED Blink',
				description: 'Blinks the device LED at a specified rate. Parameter is (period in milliseconds between change in LED state).'
			},
			{
				num: '7',
				name: 'Sensor LED On',
				description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'
			},
			{
				num: '8',
				name: 'Sensor LED Off',
				description: 'Turns off the sensor LED. No parameters.'
			},
			{
				num: '9',
				name: 'Read Sensors',
				description: 'Takes readings from the sensors. Parameters are (number of samples [1-10], milliseconds between samples).'
			},
			{
				num: '10',
				name: 'Read QR Code',
				description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'
			},
			{
				num: '11',
				name: 'Disable Sensor',
				description: 'Disables the sensors, switching them to low-power mode. No parameters.'
			},
			{
				num: '12',
				name: 'Repeat Begin',
				description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'
			},
			{
				num: '13',
				name: 'Repeat End',
				description: 'Ends the innermost block of repeated commands. No parameters.'
			},
			{
				num: '14',
				name: 'Status',
				description: 'Changes the device status register, which used in remote monitoring. Parameters are (message length, message text).'
			},
			{
				num: '99',
				name: 'Finish Test',
				description: 'Finishes the test. Required to be the final command. No parameters.'
			}
		];

		$scope.isCollapsedBCODE = true;
		$scope.BCODEButtonLabel = 'Show BCODE';
		$scope.selected_command = $scope.BCODECommands[0];
		$scope.toggleBCODE = function() {
			$scope.isCollapsedBCODE = !$scope.isCollapsedBCODE;
			$scope.BCODEButtonLabel = $scope.isCollapsedBCODE ? 'Show BCODE' : 'Hide BCODE';
		};

		$scope.moveBCODEUp = function() {

		};

		$scope.appendBCODEBottom = function() {
			$scope.BCODE.push({command: $scope.selected_command, params: $scope.params});
		};

		// Create new Assay
		$scope.create = function() {
			// Create new Assay object
			var assay = new Assays ({
				name: this.name,
				reference: this.reference,
				description: this.description,
				url: this.url,
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
				$scope.BCODE = [{command: '', params: ''}];
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Assay
		$scope.remove = function(assay) {
			if ( assay ) {
				assay.$remove();

				for (var i in $scope.assays) {
					if ($scope.assays [i] === assay) {
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
			});
		};
	}
]);
