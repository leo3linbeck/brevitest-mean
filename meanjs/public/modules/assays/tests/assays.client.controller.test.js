'use strict';

(function() {
	// Assays Controller Spec
	describe('Assays Controller Tests', function() {
		// Initialize global variables
		var AssaysController,
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

			// Initialize the Assays controller.
			AssaysController = $controller('AssaysController', {
				$scope: scope,
                $window: windowMock
			});
		}));

		it('$scope.find() should create an array with at least one Assay object fetched from XHR', inject(function(Assays) {
			// Create sample Assay using the Assays service
			var sampleAssay = new Assays({
				name: 'New Assay'
			});

			// Create a sample Assays array that includes the new Assay
			var sampleAssays = [sampleAssay];

			// Set GET response
			$httpBackend.expectGET('assays').respond(sampleAssays);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.assays).toEqualData(sampleAssays);
		}));

		it('$scope.findOne() should create an array with one Assay object fetched from XHR using a assayId URL parameter', inject(function(Assays) {
			// Define a sample Assay object
			var sampleAssay = new Assays({
				name: 'New Assay',
				analysis: {},
				standardCurve: [],
				BCODE: []
			});

			//$httpBackend.expectGET('assays/525a8422f6d0f87f0e407a33').respond(sampleAssay);
            //$httpBackend.expectGET('/cartridges/get_inventory/undefined').respond(sampleAssay)

			// Set the URL parameter
			$stateParams.assayId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/assays\/([0-9a-fA-F]{24})$/).respond(sampleAssay);
            $httpBackend.expectGET('/cartridges/get_inventory/undefined').respond(sampleAssay);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.assay).toEqualData(sampleAssay);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Assays) {
			// Create a sample Assay object
			var sampleAssayPostData = new Assays({
				name: 'New Assay',
				analysis: {},
				standardCurve: [],
				BCODE: [{'command':'Start Test','params':'0,0'},{'command':'Read Sensors','params':''},{'command':'Finish Test','params':''}]
			});

			// Create a sample Assay response
			var sampleAssayResponse = new Assays({
				_id: '525cf20451979dea2c000001',
				name: 'New Assay'
			});

			// Fixture mock form input values
			scope.name = 'New Assay';

			// Set POST response
			$httpBackend.expectPOST('assays', sampleAssayPostData).respond(sampleAssayResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Assay was created
			expect($location.path()).toBe('/assays/' + sampleAssayResponse._id);
		}));

		it('$scope.update() should update a valid Assay', inject(function(Assays) {
			// Define a sample Assay put data
			var sampleAssayPutData = new Assays({
				_id: '525cf20451979dea2c000001',
				name: 'New Assay'
			});

			// Mock Assay in scope
			scope.assay = sampleAssayPutData;

			// Set PUT response
			$httpBackend.expectPUT(/assays\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/assays/' + sampleAssayPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid assayId and remove the Assay from the scope', inject(function(Assays) {
			// Create new Assay object
			var sampleAssay = new Assays({
				_id: '525a8422f6d0f87f0e407a33'
			});

			var response = {
				data: {
					error: 'error'
				}
			};

			// Create new Assays array and include the Assay
			scope.assays = [sampleAssay];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/assays\/([0-9a-fA-F]{24})$/).respond(response);

			// Run controller functionality
			scope.remove(sampleAssay);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.assays.length).toBe(0);
		}));
	});
}());
