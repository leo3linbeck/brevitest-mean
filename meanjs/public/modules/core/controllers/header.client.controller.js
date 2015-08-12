'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$location', 'Authentication', 'Menus', 'unconfirmedUsers',
	function($scope, $location, Authentication, Menus, unconfirmedUsers) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
        
        // get UnconfirmedUsers - for badge
        $scope.getUU = function (event) {
            if (event) {
                var menuTitle = event.target.children[0].innerHTML;
                if (menuTitle === 'Manage Users') {
                    // when the promise is returned...
                    unconfirmedUsers().then(function (response) { // if its positive...
                            $scope.unconfirmedUsers = response;
                        }, function (err) { // if it is an error...
                            console.log('Failure: ' + err);
                        }
                    );   
                }
            }
        };
        
        $scope.getUU();
	}
]);
