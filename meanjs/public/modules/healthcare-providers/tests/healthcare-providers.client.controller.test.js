'use strict';

(function() {
	// Healthcare providers Controller Spec
	describe('Healthcare providers Controller Tests', function() {
		// Initialize global variables
		var HealthcareProvidersController,
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

			// Initialize the Healthcare providers controller.
			HealthcareProvidersController = $controller('HealthcareProvidersController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Healthcare provider object fetched from XHR', inject(function(HealthcareProviders) {
			// Create sample Healthcare provider using the Healthcare providers service
			var sampleHealthcareProvider = new HealthcareProviders({
				name: 'New Healthcare provider'
			});

			// Create a sample Healthcare providers array that includes the new Healthcare provider
			var sampleHealthcareProviders = [sampleHealthcareProvider];

			// Set GET response
			$httpBackend.expectGET('healthcare-providers').respond(sampleHealthcareProviders);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.healthcareProviders).toEqualData(sampleHealthcareProviders);
		}));

		it('$scope.findOne() should create an array with one Healthcare provider object fetched from XHR using a healthcareProviderId URL parameter', inject(function(HealthcareProviders) {
			// Define a sample Healthcare provider object
			var sampleHealthcareProvider = new HealthcareProviders({
				name: 'New Healthcare provider'
			});

			// Set the URL parameter
			$stateParams.healthcareProviderId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/healthcare-providers\/([0-9a-fA-F]{24})$/).respond(sampleHealthcareProvider);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.healthcareProvider).toEqualData(sampleHealthcareProvider);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(HealthcareProviders) {
			// Create a sample Healthcare provider object
			var sampleHealthcareProviderPostData = new HealthcareProviders({
				name: 'New Healthcare provider'
			});

			// Create a sample Healthcare provider response
			var sampleHealthcareProviderResponse = new HealthcareProviders({
				_id: '525cf20451979dea2c000001',
				name: 'New Healthcare provider'
			});

			// Fixture mock form input values
			scope.name = 'New Healthcare provider';

			// Set POST response
			$httpBackend.expectPOST('healthcare-providers', sampleHealthcareProviderPostData).respond(sampleHealthcareProviderResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Healthcare provider was created
			expect($location.path()).toBe('/healthcare-providers/' + sampleHealthcareProviderResponse._id);
		}));

		it('$scope.update() should update a valid Healthcare provider', inject(function(HealthcareProviders) {
			// Define a sample Healthcare provider put data
			var sampleHealthcareProviderPutData = new HealthcareProviders({
				_id: '525cf20451979dea2c000001',
				name: 'New Healthcare provider'
			});

			// Mock Healthcare provider in scope
			scope.healthcareProvider = sampleHealthcareProviderPutData;

			// Set PUT response
			$httpBackend.expectPUT(/healthcare-providers\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/healthcare-providers/' + sampleHealthcareProviderPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid healthcareProviderId and remove the Healthcare provider from the scope', inject(function(HealthcareProviders) {
			// Create new Healthcare provider object
			var sampleHealthcareProvider = new HealthcareProviders({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Healthcare providers array and include the Healthcare provider
			scope.healthcareProviders = [sampleHealthcareProvider];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/healthcare-providers\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleHealthcareProvider);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.healthcareProviders.length).toBe(0);
		}));
	});
}());