'use strict';

(function() {
    // create mock Socket service
    angular.module('mock.tests', []).
        factory('mockSocket', function() {
            return { 
                io: {},
                on: function () {}
            };
        }
    );
    
	// Run test Controller Spec
	describe('Run test Controller Tests', function() {
		// Initialize global variables
		var RunTestController,
			scope,
			$httpBackend,
			$stateParams,
			$location;

		// The $resource service augments the response object with methods for updating and deleting the resource.
		// If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
		// the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
		// When the toEqualData matcher compares two objects, it takes only object properties into
		// account and ignores methods.
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Then we can start by loading the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
        beforeEach(module('mock.tests')); // https://gist.github.com/alicial/7681791

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _mockSocket_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;
            
			// Initialize the Run test controller.
			RunTestController = $controller('RunTestController', {
				$scope: scope,
                Socket: _mockSocket_ // inject mockSocket in place of Socket service
			});
		}));

		it('$scope.setupRun() should initialize variables', inject(function() {
            var deviceListResponse = {
                name: 'Mr. Anderson',
                serialNumber: 'abc123',
                calibrationSteps: '42',
                status: 'AOK',
                manufacturedOn: 'July 4, 1776',
                registeredOn: 'January 1, 1492 ',
                _deviceModel: 'Jaguar',
                _devicePool: 'pool',
                particleID: 'quark'
            };
            
            // Set GET response
            $httpBackend.expectGET('/devices/available').respond(deviceListResponse);
            
            // Run controller functionality
            scope.setupRun();
            $httpBackend.flush();
            
            // Test variables are set
            expect(scope.devices).toEqual(deviceListResponse);
            expect(scope.reference).toEqual('');
            expect(scope.subject).toEqual('');
            expect(scope.description).toEqual('');
            expect(scope.cartridge).toEqual({});
            expect(scope.assay).toEqual({});
		}));
	});
}());
