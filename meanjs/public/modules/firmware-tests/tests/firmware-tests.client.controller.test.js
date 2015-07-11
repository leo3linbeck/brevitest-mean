'use strict';

(function() {
	// Firmware tests Controller Spec
	describe('Firmware tests Controller Tests', function() {
		// Initialize global variables
		var FirmwareTestsController,
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

			// Initialize the Firmware tests controller.
			FirmwareTestsController = $controller('FirmwareTestsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Firmware test object fetched from XHR', inject(function(FirmwareTests) {
			// Create sample Firmware test using the Firmware tests service
			var sampleFirmwareTest = new FirmwareTests({
				name: 'New Firmware test'
			});

			// Create a sample Firmware tests array that includes the new Firmware test
			var sampleFirmwareTests = [sampleFirmwareTest];

			// Set GET response
			$httpBackend.expectGET('firmware-tests').respond(sampleFirmwareTests);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.firmwareTests).toEqualData(sampleFirmwareTests);
		}));

		it('$scope.findOne() should create an array with one Firmware test object fetched from XHR using a firmwareTestId URL parameter', inject(function(FirmwareTests) {
			// Define a sample Firmware test object
			var sampleFirmwareTest = new FirmwareTests({
				name: 'New Firmware test'
			});

			// Set the URL parameter
			$stateParams.firmwareTestId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/firmware-tests\/([0-9a-fA-F]{24})$/).respond(sampleFirmwareTest);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.firmwareTest).toEqualData(sampleFirmwareTest);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(FirmwareTests) {
			// Create a sample Firmware test object
			var sampleFirmwareTestPostData = new FirmwareTests({
				name: 'New Firmware test'
			});

			// Create a sample Firmware test response
			var sampleFirmwareTestResponse = new FirmwareTests({
				_id: '525cf20451979dea2c000001',
				name: 'New Firmware test'
			});

			// Fixture mock form input values
			scope.name = 'New Firmware test';

			// Set POST response
			$httpBackend.expectPOST('firmware-tests', sampleFirmwareTestPostData).respond(sampleFirmwareTestResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Firmware test was created
			expect($location.path()).toBe('/firmware-tests/' + sampleFirmwareTestResponse._id);
		}));

		it('$scope.update() should update a valid Firmware test', inject(function(FirmwareTests) {
			// Define a sample Firmware test put data
			var sampleFirmwareTestPutData = new FirmwareTests({
				_id: '525cf20451979dea2c000001',
				name: 'New Firmware test'
			});

			// Mock Firmware test in scope
			scope.firmwareTest = sampleFirmwareTestPutData;

			// Set PUT response
			$httpBackend.expectPUT(/firmware-tests\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/firmware-tests/' + sampleFirmwareTestPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid firmwareTestId and remove the Firmware test from the scope', inject(function(FirmwareTests) {
			// Create new Firmware test object
			var sampleFirmwareTest = new FirmwareTests({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Firmware tests array and include the Firmware test
			scope.firmwareTests = [sampleFirmwareTest];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/firmware-tests\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleFirmwareTest);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.firmwareTests.length).toBe(0);
		}));
	});
}());