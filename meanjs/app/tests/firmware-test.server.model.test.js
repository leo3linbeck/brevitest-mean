'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	FirmwareTest = mongoose.model('FirmwareTest');

/**
 * Globals
 */
var user, firmwareTest;

/**
 * Unit tests
 */
describe('Firmware test Model Unit Tests:', function() {
	beforeEach(function(done) {
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		user.save(function() { 
			firmwareTest = new FirmwareTest({
				name: 'Firmware test Name',
				user: user
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('should be able to save without problems', function(done) {
			return firmwareTest.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be able to show an error when try to save without name', function(done) { 
			firmwareTest.name = '';

			return firmwareTest.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	afterEach(function(done) { 
		FirmwareTest.remove().exec();
		User.remove().exec();

		done();
	});
});