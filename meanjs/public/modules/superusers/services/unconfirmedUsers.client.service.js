'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('unconfirmedUsers', [ 'Superusers', '$q', function (Superusers, $q) {
    return function () {
        var users = []; // empty users array
        var unconfirmedUsers = 0; 
        var deferred = $q.defer(); 
        Superusers.query(function (response) {
            users = response;
            // count the number of users without the role 'user' and save to variable: unconfirmedUsers
            for (var i = 0; i < users.length; i++) {
                if (!(users[i].roles.indexOf('user') > -1)) {
                    unconfirmedUsers++;
                }
            }
            deferred.resolve(unconfirmedUsers); // resolve and pass unconfirmedUsers
        }, function (errResponse) {
            deferred.reject(errResponse); // reject and pass the error response from the backend
        });
        return deferred.promise; // return the promise
    };
}]);
