'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Assay = mongoose.model('Assay');

/**
 * Globals
 */
var user, assay;

/**
 * Unit tests
 */
describe('Assay Model Unit Tests:', function() {
	beforeEach(function(done) {
		user = new User({
			id: 'XXX',
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		user.save(function() {
			assay = new Assay({
				name: 'Assay Name',
				user: user
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('should be able to save without problems', function(done) {
			return assay.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be able to show an error when try to save without name', function(done) {
			assay.name = '';

			return assay.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	afterEach(function(done) {
		Assay.remove().exec();
		User.remove().exec();

		done();
	});
});
