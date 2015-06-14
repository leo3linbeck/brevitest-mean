'use strict';

(function() {
	// Manufacturers Controller Spec
	describe('Manufacturers Controller Tests', function() {
		// Initialize global variables
		var ManufacturersController,
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

			// Initialize the Manufacturers controller.
			ManufacturersController = $controller('ManufacturersController', {
				$scope: scope,
                $window: windowMock
			});
		}));

		it('$scope.find() should create an array with at least one Manufacturer object fetched from XHR', inject(function(Manufacturers) {
			// Create sample Manufacturer using the Manufacturers service
			var sampleManufacturer = new Manufacturers({
				name: 'New Manufacturer'
			});

			// Create a sample Manufacturers array that includes the new Manufacturer
			var sampleManufacturers = [sampleManufacturer];

			// Set GET response
			$httpBackend.expectGET('manufacturers').respond(sampleManufacturers);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.manufacturers).toEqualData(sampleManufacturers);
		}));

		it('$scope.findOne() should create an array with one Manufacturer object fetched from XHR using a manufacturerId URL parameter', inject(function(Manufacturers) {
			// Define a sample Manufacturer object
			var addresses = [];
			['Main', 'Business', 'Operations', 'Other'].forEach(function(a) {
				addresses.push({
					location: a,
					street1: '',
					street2: '',
					city: '',
					state: '',
					zipcode: ''
				});
			});

			var sampleManufacturer = new Manufacturers({
				name: 'New Manufacturer',
				addresses: addresses
			});

			// Set the URL parameter
			$stateParams.manufacturerId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/manufacturers\/([0-9a-fA-F]{24})$/).respond(sampleManufacturer);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.manufacturer).toEqualData(sampleManufacturer);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Manufacturers) {
			// Create a sample Manufacturer object
			var addresses = [];
			['Main', 'Business', 'Operations', 'Other'].forEach(function(a) {
				addresses.push({
					location: a,
					street1: '',
					street2: '',
					city: '',
					state: '',
					zipcode: ''
				});
			});

			var sampleManufacturerPostData = new Manufacturers({
				name: 'New Manufacturer',
				addresses: addresses
			});

			// Create a sample Manufacturer response
			var sampleManufacturerResponse = new Manufacturers({
				_id: '525cf20451979dea2c000001',
				name: 'New Manufacturer'
			});

			// Fixture mock form input values
			scope.name = 'New Manufacturer';

			// Set POST response
			$httpBackend.expectPOST('manufacturers', sampleManufacturerPostData).respond(sampleManufacturerResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Manufacturer was created
			expect($location.path()).toBe('/manufacturers/' + sampleManufacturerResponse._id);
		}));

		it('$scope.update() should update a valid Manufacturer', inject(function(Manufacturers) {
			// Define a sample Manufacturer put data
			var sampleManufacturerPutData = new Manufacturers({
				_id: '525cf20451979dea2c000001',
				name: 'New Manufacturer'
			});

			// Mock Manufacturer in scope
			scope.manufacturer = sampleManufacturerPutData;

			// Set PUT response
			$httpBackend.expectPUT(/manufacturers\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/manufacturers/' + sampleManufacturerPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid manufacturerId and remove the Manufacturer from the scope', inject(function(Manufacturers) {
			// Create new Manufacturer object
			var sampleManufacturer = new Manufacturers({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Manufacturers array and include the Manufacturer
			scope.manufacturers = [sampleManufacturer];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/manufacturers\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleManufacturer);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.manufacturers.length).toBe(0);
		}));
	});
}());
