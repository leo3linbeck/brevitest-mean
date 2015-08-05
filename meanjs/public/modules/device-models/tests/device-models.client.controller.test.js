'use strict';

(function() {
	// Device models Controller Spec
	describe('Device models Controller Tests', function() {
		// Initialize global variables
		var DeviceModelsController,
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

			var windowMock = { confirm: function(msg) { return true; } };

			// Initialize the Device models controller.
			DeviceModelsController = $controller('DeviceModelsController', {
				$scope: scope,
                $window: windowMock
			});
		}));

		it('$scope.find() should create an array with at least one Device model object fetched from XHR', inject(function(DeviceModels) {
			// Create sample Device model using the Device models service
			var sampleDeviceModel = new DeviceModels({
				name: 'New Device model'
			});

			// Create a sample Device models array that includes the new Device model
			var sampleDeviceModels = [sampleDeviceModel];

			// Set GET response
			$httpBackend.expectGET('device-models').respond(sampleDeviceModels);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.deviceModels).toEqualData(sampleDeviceModels);
		}));

		it('$scope.findOne() should create an array with one Device model object fetched from XHR using a deviceModelId URL parameter', inject(function(DeviceModels) {
			// Define a sample Device model object
			var sampleDeviceModel = new DeviceModels({
				name: 'New Device model'
			});

			// Set the URL parameter
			$stateParams.deviceModelId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/device-models\/([0-9a-fA-F]{24})$/).respond(sampleDeviceModel);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.deviceModel).toEqualData(sampleDeviceModel);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(DeviceModels) {
			// Create a sample Device model object
			var sampleDeviceModelPostData = new DeviceModels({
				name: 'New Device model'
			});

			// Create a sample Device model response
			var sampleDeviceModelResponse = new DeviceModels({
				_id: '525cf20451979dea2c000001',
				name: 'New Device model'
			});

			// Fixture mock form input values
			scope.name = 'New Device model';

			// Set POST response
			$httpBackend.expectPOST('device-models', sampleDeviceModelPostData).respond(sampleDeviceModelResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Device model was created
			expect($location.path()).toBe('/device-models');
		}));

		it('$scope.update() should update a valid Device model', inject(function(DeviceModels) {
			// Define a sample Device model put data
			var sampleDeviceModelPutData = new DeviceModels({
				_id: '525cf20451979dea2c000001',
				name: 'New Device model'
			});

			// Mock Device model in scope
			scope.deviceModel = sampleDeviceModelPutData;

			// Set PUT response
			$httpBackend.expectPUT(/device-models\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/device-models');
		}));

		it('$scope.remove() should send a DELETE request with a valid deviceModelId and remove the Device model from the scope', inject(function(DeviceModels) {
			// Create new Device model object
			var sampleDeviceModel = new DeviceModels({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Device models array and include the Device model
			scope.deviceModels = [sampleDeviceModel];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/device-models\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleDeviceModel);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.deviceModels.length).toBe(0);
		}));
	});
}());
