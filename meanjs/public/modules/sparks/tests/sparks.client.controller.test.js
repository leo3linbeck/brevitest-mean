'use strict';

(function() {
	// Sparks Controller Spec
	describe('Sparks Controller Tests', function() {
		// Initialize global variables
		var SparksController,
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

			// Initialize the Sparks controller.
			SparksController = $controller('SparksController', {
				$scope: scope,
                $window: windowMock
			});
		}));

		it('$scope.find() should create an array with at least one Spark object fetched from XHR', inject(function(Sparks) {
			// Create sample Spark using the Sparks service
			var sampleSpark = new Sparks({
				name: 'New Spark',
				sparkID: '525a8422f6d0f87f0e407a33'
			});

			// Create a sample Sparks array that includes the new Spark
			var sampleSparks = [sampleSpark];

			// Set GET response
			$httpBackend.expectGET('sparks').respond(sampleSparks);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.sparks).toEqualData(sampleSparks);
		}));

		it('$scope.findOne() should create an array with one Spark object fetched from XHR using a sparkId URL parameter', inject(function(Sparks) {
			// Define a sample Spark object
			var sampleSpark = new Sparks({
				name: 'New Spark',
				sparkID: '525a8422f6d0f87f0e407a33'
			});

			// Set the URL parameter
			$stateParams.sparkId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/sparks\/([0-9a-fA-F]{24})$/).respond(sampleSpark);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.spark).toEqualData(sampleSpark);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Sparks) {
			// Create a sample Spark object
			var sampleSparkPostData = new Sparks({
				name: 'New Spark',
				sparkID: '525a8422f6d0f87f0e407a33'
			});

			// Create a sample Spark response
			var sampleSparkResponse = new Sparks({
				_id: '525cf20451979dea2c000001',
				name: 'New Spark',
				sparkID: '525a8422f6d0f87f0e407a33'
			});

			// Fixture mock form input values
			scope.name = 'New Spark';
			scope.sparkID = '525a8422f6d0f87f0e407a33';

			// Set POST response
			$httpBackend.expectPOST('sparks', sampleSparkPostData).respond(sampleSparkResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');
			expect(scope.sparkID).toEqual('');

			// Test URL redirection after the Spark was created
			expect($location.path()).toBe('/sparks/' + sampleSparkResponse._id);
		}));

		it('$scope.update() should update a valid Spark', inject(function(Sparks) {
			// Define a sample Spark put data
			var sampleSparkPutData = new Sparks({
				_id: '525cf20451979dea2c000001',
				name: 'New Spark'
			});

			// Mock Spark in scope
			scope.spark = sampleSparkPutData;

			// Set PUT response
			$httpBackend.expectPUT(/sparks\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/sparks/' + sampleSparkPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid sparkId and remove the Spark from the scope', inject(function(Sparks) {
			// Create new Spark object
			var sampleSpark = new Sparks({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Sparks array and include the Spark
			scope.sparks = [sampleSpark];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/sparks\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleSpark);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.sparks.length).toBe(0);
		}));
	});
}());
