//'use strict';
//
////Superusers service used to communicate Superusers REST endpoints
//angular.module('superusers').factory('Superusers', ['$resource',
//	function($resource) {
//		return $resource('superusers/:superuserId', { superuserId: '@_id'
//		}, {
//			update: {
//				method: 'PUT'
//			}
//		});
//	}
//]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('Superusers', ['$resource',
	function($resource) {
		return $resource('users/:userId', { userId: '@_id'
        }, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
