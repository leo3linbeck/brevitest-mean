'use strict';

(function() {
    angular.module('mock.users', []).
        factory('mockAuthentication', function() {
            return { user: { roles: []} };
        }
    );

	describe('HomeController', function() {
		//Initialize global variables
		var scope,
			HomeController,
            $location;

		// Load the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));
        beforeEach(module('mock.users')); // https://gist.github.com/alicial/7681791

        beforeEach(inject(function($controller, $rootScope, _$location_, _mockAuthentication_) {
			scope = $rootScope.$new();
            $location = _$location_;

			HomeController = $controller('HomeController', {
				$scope: scope,
                Authentication: _mockAuthentication_
			});
		}));

        it('should expose the authentication service', function() {
			expect(scope.authentication).toBeTruthy();
		});
	});
})();
