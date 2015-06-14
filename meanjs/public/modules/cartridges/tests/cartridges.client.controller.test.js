'use strict';

(function() {
	// Cartridges Controller Spec
	describe('Cartridges Controller Tests', function() {
		// Initialize global variables
		var CartridgesController,
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

			var windowMock = { confirm: function(msg) { return true } };

			// Initialize the Cartridges controller.
			CartridgesController = $controller('CartridgesController', {
				$scope: scope,
				$window: windowMock
			});
		}));

		it('$scope.find() should create an array with at least one Cartridge object fetched from XHR', inject(function(Cartridges) {
			// Create sample Cartridge using the Cartridges service
			var sampleCartridge = new Cartridges({
				name: 'New Cartridge'
			});

			// Create a sample Cartridges array that includes the new Cartridge
			var sampleCartridges = [sampleCartridge];

			// Set GET response
			$httpBackend.expectGET('cartridges').respond(sampleCartridges);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.cartridges).toEqualData(sampleCartridges);
		}));

		it('$scope.findOne() should create an array with one Cartridge object fetched from XHR using a cartridgeId URL parameter', inject(function(Cartridges) {
			// Define a sample Cartridge object
			var sampleCartridge = new Cartridges({
				name: 'New Cartridge'
			});

			// Set the URL parameter
			$stateParams.cartridgeId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/cartridges\/([0-9a-fA-F]{24})$/).respond(sampleCartridge);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.cartridge).toEqualData(sampleCartridge);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Cartridges) {
			// Create a sample Cartridge object
			var sampleCartridgePostData = new Cartridges({
				name: 'New Cartridge'
			});

			// Create a sample Cartridge response
			var sampleCartridgeResponse = new Cartridges({
				_id: '525cf20451979dea2c000001',
				name: 'New Cartridge'
			});

			// Fixture mock form input values
			scope.name = 'New Cartridge';

			// Set POST response
			$httpBackend.expectPOST('cartridges', sampleCartridgePostData).respond(sampleCartridgeResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Cartridge was created
			expect($location.path()).toBe('/cartridges/' + sampleCartridgeResponse._id);
		}));

		it('$scope.update() should update a valid Cartridge', inject(function(Cartridges) {
			// Define a sample Cartridge put data
			var sampleCartridgePutData = new Cartridges({
				_id: '525cf20451979dea2c000001',
				name: 'New Cartridge'
			});

			// Mock Cartridge in scope
			scope.cartridge = sampleCartridgePutData;

			// Set PUT response
			$httpBackend.expectPUT(/cartridges\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/cartridges/' + sampleCartridgePutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid cartridgeId and remove the Cartridge from the scope', inject(function(Cartridges) {
			// Create new Cartridge object
			var sampleCartridge = new Cartridges({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Cartridges array and include the Cartridge
			scope.cartridges = [sampleCartridge];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/cartridges\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleCartridge);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.cartridges.length).toBe(0);
		}));
	});
}());
