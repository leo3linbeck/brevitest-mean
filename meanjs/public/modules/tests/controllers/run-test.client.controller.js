'use strict';

var _ = window._;
var $ = window.$;

// Tests controller
angular.module('tests').controller('RunTestController', ['$scope', '$http', '$location', '$modal', '$window', 'Authentication', 'Tests', 'Notification', 'Socket',
    function($scope, $http, $location, $modal, $window, Authentication, Tests, Notification, Socket) {
        $scope.authentication = Authentication;
        if (!$scope.authentication || $scope.authentication.user === '') {
            $location.path('/signin');
        }

        Socket.on('test.complete', function(message) {
            $scope.setupRun();
        });

        function updateBatteryLevel(level) {
            $scope.batteryLevel = level;
            if (level) {
                $scope.batteryCharging = (level < 0);
                level = Math.abs(level);
                if (level < 10) {
                    $scope.batteryImage = 'modules/devices/img/battery-empty.gif';
                }
                else if (level < 30) {
                    $scope.batteryImage = 'modules/devices/img/battery-one-quarter.gif';
                }
                else if (level < 60) {
                    $scope.batteryImage = 'modules/devices/img/battery-half.gif';
                }
                else if (level < 90) {
                    $scope.batteryImage = 'modules/devices/img/battery-three-quarters.gif';
                }
                else {
                    $scope.batteryImage = 'modules/devices/img/battery-full.gif';
                }
            }
            else {
                $scope.batteryCharging = false;
                $scope.batteryImage = '';
            }
        }

        $scope.setupRun = function() {
            $scope.loadDevices();
            $scope.reference = '';
            $scope.subject = '';
            $scope.description = '';
            $scope.cartridge = {};
            $scope.assay = {};
            updateBatteryLevel(0);
        };

        $scope.refreshDevices = function() {
            console.log('Refreshing device list');
            $http.post('/devices/release').
            success(function(data, status, headers, config) {
                $scope.devices = data;
                $scope.activeDevice = -1;
            }).
            error(function(err, status, headers, config) {
                console.log(err, status, headers(), config);
                Notification.error(err.message);
            });
        };

        $scope.rescanCartridge = function() {
            Notification.info('Rescanning cartridge, please wait...');
            $http.post('/devices/rescan_cartridge', {
                deviceID: $scope.devices[$scope.activeDevice]._id
            }).
            success(function(data, status, headers, config) {
                $scope.cartridge = data.cartridge;
                $scope.assay = data.assay;
            }).
            error(function(err, status, headers, config) {
                console.log(err);
                Notification.error(err.message);
            });
        };

        $scope.loadDevices = function() {
            $http.get('/devices/available').
            success(function(data, status, headers, config) {
                $scope.devices = data;
                $scope.activeDevice = -1;
            }).
            error(function(err, status, headers, config) {
                console.log(err);
                Notification.error(err.message);
            });
        };

        $scope.clickDevice = function(indx) {
            if (indx === $scope.activeDevice) { // release device if highlighted device is clicked
                $scope.releaseDevice(indx);
            } else {
                $scope.claimDevice(indx);
            }
        };

        $scope.releaseDevice = function(indx) {
            if (indx !== -1) {
                Notification.info('Releasing device, please wait...');
                $http.post('/devices/release', {
                    deviceID: indx === -1 ? '' : $scope.devices[indx]._id
                }).
                success(function(data, status, headers, config) {
                    $scope.devices[indx].claimed = data.claimed;
                    if (data.claimed) {
                        $scope.activeDevice = indx;
                        Notification.error('Device not released');
                    } else {
                        Notification.info('Device released');
                        $scope.cartridge = {};
                        $scope.assay = {};
                        updateBatteryLevel(0);
                }
                }).
                error(function(err, status, headers, config) {
                    console.log(err);
                    Notification.error(err.message);
                    $scope.activeDevice = indx;
                });
                $scope.activeDevice = -1;
            }
        };

        $scope.claimDevice = function(indx) {
            updateBatteryLevel(0);
            Notification.info('Claiming device, please wait...');
            $http.post('/devices/claim', {
                currentDeviceID: $scope.activeDevice === -1 ? '' : $scope.devices[$scope.activeDevice]._id,
                newDeviceID: $scope.devices[indx]._id
            }).
            success(function(data, status, headers, config) {
                Notification.info('Device claimed');
                $scope.devices[indx].claimed = true;
                $scope.cartridge = data.cartridge;
                $scope.assay = data.assay;
                updateBatteryLevel(data.batteryLevel);
        }).
            error(function(err, status, headers, config) {
                console.log(err);
                Notification.error(err.message);
                $scope.releaseDevice($scope.activeDevice);
                $scope.activeDevice = -1;
            });
            $scope.activeDevice = indx;
        };

        $scope.beginTest = function() {
            var device;
            if (!$scope.reference) {
                Notification.error('You must enter a reference number');
            } else {
                if ($scope.activeDevice !== -1) {
                    Notification.success('Starting test, please wait...');
                    device = $scope.devices[$scope.activeDevice];
                    $scope.activeDevice = -1;
                    $http.post('/tests/begin', {
                        reference: $scope.reference,
                        subject: $scope.subject,
                        description: $scope.description,
                        deviceID: device._id,
                        deviceName: device.name,
                        assayID: $scope.assay._id,
                        assayName: $scope.assay.name,
                        cartridgeID: $scope.cartridge._id
                    }).
                    success(function(data, status, headers, config) {
                        $scope.setupRun();
                    }).
                    error(function(err, status, headers, config) {
                        console.log(err);
                        Notification.error(err.message);
                    });
                }
            }
        };
    }
]);
