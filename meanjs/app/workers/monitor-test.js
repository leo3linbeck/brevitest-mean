// 'use strict';
//
// /**
//  * Module dependencies.
//  */
// var mongoose = require('mongoose'),
//   errorHandler = require('./errors.server.controller'),
//   Test = mongoose.model('Test'),
//   Assay = mongoose.model('Assay'),
//   Device = mongoose.model('Device'),
//   Cartridge = mongoose.model('Cartridge'),
//   Spark = mongoose.model('Spark'),
//   sparkcore = require('spark'),
//   Q = require('q'),
//   _ = require('lodash');
//
// var updating = false;
//
// function updateOneTest(testID) {
//   var sparkDevice, sparkID, test;
//
//   Q.fcall(function(id) {
//     return new Q(Test.findById(id).populate('_device', 'name _spark').exec());
//   }, testID)
//   .then(function(t) {
//     test = t;
//     return new Q(Spark.findById(t._device._spark).exec());
//   })
//   .then(function(s) {
//     sparkID = s.sparkID;
//     console.log('Spark login');
//     return new Q(sparkcore.login({
//       username: 'leo3@linbeck.com',
//       password: '2january88'
//     }));
//   })
//   .then(function() {
//     console.log('Spark listDevices', sparkID);
//     return new Q(sparkcore.listDevices());
//   })
//   .then(function(sparkDevices) {
//     console.log('Check whether device is online', sparkDevices);
//
//     sparkDevice = _.findWhere(sparkDevices, {
//       id: sparkID
//     });
//
//     if (!sparkDevice.attributes.connected) {
//       throw new Error(test._device.name + ' is not online.');
//     }
//   })
//   .then(function() {
//     return new Q(sparkDevice.getVariable('testrunning'));
//   })
//   .then(function(v) {
//     if (test._cartridge.toHexString() === v.result) { // test t is underway on this device
//       test.status = 'In progress';
//       return true;
//     }
//     else {
//       updating = false;
//       if (test.status !== 'Cancelled') {
//         test.status = 'Complete';
//       }
//       return false;
//     }
//   })
//   .then(function(test_in_progress) {
//     if (test_in_progress) {
//       return new Q(sparkDevice.getVariable('percentdone'));
//     }
//     else {
//       if (test.status === 'Cancelled') {
//         return {result: test.percentComplete};
//       }
//       else {
//         return {result: 100};
//       }
//     }
//   })
//   .then(function(pctDone) {
//     test.percentComplete = pctDone.result;
//     console.log('save');
//     test.save();
//     if (test.percentComplete === 100) {
//       updating = false;
//     }
//     return test;
//   })
//   .fail(function(err) {
//     console.log('Error', sparkDevice, test);
//     throw new Error(err);
//   })
//   .done();
// }
//
// module.exports = function(msg) {
//   var message = JSON.parse(msg);
//
//   switch (message.command) {
//     case 'update':
//       postMessage('Updating test ' + message.testID);
//       var startTime = new Date();
//       var timeoutLimit = 1200000; // timeout after 20 minutes
//       var runInterval = 5000; // check every 5 seconds
//       updating = true;
//       (function doIt() {
//         setTimeout(function() {
//           updateOneTest(message.testID);
//           var now = new Date();
//           if ((now - startTime) > timeoutLimit) {
//             updating = false;
//           }
//         }, runInterval);
//
//         if (updating) {
//           doIt();
//         }
//         else {
//           close();
//         }
//       })();
//       break;
//     case 'close':
//       close();
//       break;
//   }
// };
// /* jshint ignore:start */
