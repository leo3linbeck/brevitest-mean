'use strict';

(function() {
	// Superusers Controller Spec
	describe('Superusers Controller Tests', function() {
		// Initialize global variables
		var SuperusersController,
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

			// Initialize the Superusers controller.
			SuperusersController = $controller('SuperusersController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Superuser object fetched from XHR', inject(function(Superusers) {
			// Create sample Superuser using the Superusers service
			var sampleSuperuser = new Superusers({
				name: 'New Superuser'
			});

			// Create a sample Superusers array that includes the new Superuser
			var sampleSuperusers = [sampleSuperuser];

			// Set GET response
			$httpBackend.expectGET('superusers').respond(sampleSuperusers);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.superusers).toEqualData(sampleSuperusers);
		}));

		it('$scope.findOne() should create an array with one Superuser object fetched from XHR using a superuserId URL parameter', inject(function(Superusers) {
			// Define a sample Superuser object
			var sampleSuperuser = new Superusers({
				name: 'New Superuser'
			});

			// Set the URL parameter
			$stateParams.superuserId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/superusers\/([0-9a-fA-F]{24})$/).respond(sampleSuperuser);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.superuser).toEqualData(sampleSuperuser);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Superusers) {
			// Create a sample Superuser object
			var sampleSuperuserPostData = new Superusers({
				name: 'New Superuser'
			});

			// Create a sample Superuser response
			var sampleSuperuserResponse = new Superusers({
				_id: '525cf20451979dea2c000001',
				name: 'New Superuser'
			});

			// Fixture mock form input values
			scope.name = 'New Superuser';

			// Set POST response
			$httpBackend.expectPOST('superusers', sampleSuperuserPostData).respond(sampleSuperuserResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Superuser was created
			expect($location.path()).toBe('/superusers/' + sampleSuperuserResponse._id);
		}));

		it('$scope.update() should update a valid Superuser', inject(function(Superusers) {
			// Define a sample Superuser put data
			var sampleSuperuserPutData = new Superusers({
				_id: '525cf20451979dea2c000001',
				name: 'New Superuser'
			});

			// Mock Superuser in scope
			scope.superuser = sampleSuperuserPutData;

			// Set PUT response
			$httpBackend.expectPUT(/superusers\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/superusers/' + sampleSuperuserPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid superuserId and remove the Superuser from the scope', inject(function(Superusers) {
			// Create new Superuser object
			var sampleSuperuser = new Superusers({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Superusers array and include the Superuser
			scope.superusers = [sampleSuperuser];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/superusers\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleSuperuser);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.superusers.length).toBe(0);
		}));
	});
}());