'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	HealthcareProvider = mongoose.model('HealthcareProvider');

/**
 * Globals
 */
var user, healthcareProvider;

/**
 * Unit tests
 */
describe('Healthcare provider Model Unit Tests:', function() {
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
			healthcareProvider = new HealthcareProvider({
				name: 'Healthcare provider Name',
				user: user
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('should be able to save without problems', function(done) {
			return healthcareProvider.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be able to show an error when try to save without name', function(done) { 
			healthcareProvider.name = '';

			return healthcareProvider.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	afterEach(function(done) { 
		HealthcareProvider.remove().exec();
		User.remove().exec();

		done();
	});
});