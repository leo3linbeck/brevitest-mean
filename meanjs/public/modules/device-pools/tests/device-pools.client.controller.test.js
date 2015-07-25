'use strict';

(function() {
	// Device pools Controller Spec
	describe('Device pools Controller Tests', function() {
		// Initialize global variables
		var DevicePoolsController,
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

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;

			// Initialize the Device pools controller.
			DevicePoolsController = $controller('DevicePoolsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Device pool object fetched from XHR', inject(function(DevicePools) {
			// Create sample Device pool using the Device pools service
			var sampleDevicePool = new DevicePools({
				name: 'New Device pool'
			});

			// Create a sample Device pools array that includes the new Device pool
			var sampleDevicePools = [sampleDevicePool];

			// Set GET response
			$httpBackend.expectGET('device-pools').respond(sampleDevicePools);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.devicePools).toEqualData(sampleDevicePools);
		}));

		it('$scope.findOne() should create an array with one Device pool object fetched from XHR using a devicePoolId URL parameter', inject(function(DevicePools) {
			// Define a sample Device pool object
			var sampleDevicePool = new DevicePools({
				name: 'New Device pool'
			});

			// Set the URL parameter
			$stateParams.devicePoolId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/device-pools\/([0-9a-fA-F]{24})$/).respond(sampleDevicePool);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.devicePool).toEqualData(sampleDevicePool);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(DevicePools) {
			// Create a sample Device pool object
			var sampleDevicePoolPostData = new DevicePools({
				name: 'New Device pool'
			});

			// Create a sample Device pool response
			var sampleDevicePoolResponse = new DevicePools({
				_id: '525cf20451979dea2c000001',
				name: 'New Device pool'
			});

			// Fixture mock form input values
			scope.name = 'New Device pool';

			// Set POST response
			$httpBackend.expectPOST('device-pools', sampleDevicePoolPostData).respond(sampleDevicePoolResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Device pool was created
			expect($location.path()).toBe('/device-pools/' + sampleDevicePoolResponse._id);
		}));

		it('$scope.update() should update a valid Device pool', inject(function(DevicePools) {
			// Define a sample Device pool put data
			var sampleDevicePoolPutData = new DevicePools({
				_id: '525cf20451979dea2c000001',
				name: 'New Device pool'
			});

			// Mock Device pool in scope
			scope.devicePool = sampleDevicePoolPutData;

			// Set PUT response
			$httpBackend.expectPUT(/device-pools\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/device-pools/' + sampleDevicePoolPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid devicePoolId and remove the Device pool from the scope', inject(function(DevicePools) {
			// Create new Device pool object
			var sampleDevicePool = new DevicePools({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Device pools array and include the Device pool
			scope.devicePools = [sampleDevicePool];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/device-pools\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleDevicePool);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.devicePools.length).toBe(0);
		}));
	});
}());