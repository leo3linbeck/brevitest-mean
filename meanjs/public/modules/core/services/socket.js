'use strict';
/*global io:false */
//socket factory that provides the socket service
angular.module('core').factory('Socket', ['socketFactory', '$location',
    function(socketFactory, $location) {
      console.log('socket.io $location', $location);
        return socketFactory({
            prefix: '',
            ioSocket: io.connect('http://' + $location.host() + ':' + $location.port())
        });
    }
]);
