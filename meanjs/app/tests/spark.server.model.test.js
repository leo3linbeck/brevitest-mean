'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Spark = mongoose.model('Spark');

/**
 * Globals
 */
var user, spark;

/**
 * Unit tests
 */
describe('Spark Model Unit Tests:', function() {
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
			spark = new Spark({
				name: 'Spark Name',
				sparkID: '0123456789ABCDEF0123456789ABCDEF',
				user: user
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('should be able to save without problems', function(done) {
			return spark.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be able to show an error when try to save without name', function(done) {
			spark.name = '';

			return spark.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('should be able to show an error when try to save without sparkID', function(done) {
			spark.sparkID = '';

			return spark.save(function(err) {
				should.exist(err);
				done();
			});
		});

		// it('should be able to show an error when try to save with a sparkID that is too short', function(done) {
		// 	spark.sparkID = '0123456789ABCDEF';
		//
		// 	return spark.save(function(err) {
		// 		should.exist(err);
		// 		done();
		// 	});
		// });
		//
		// it('should be able to show an error when try to save with a sparkID that is too long', function(done) {
		// 	spark.sparkID = '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF';
		//
		// 	return spark.save(function(err) {
		// 		should.exist(err);
		// 		done();
		// 	});
		// });
	});

	afterEach(function(done) {
		Spark.remove().exec();
		User.remove().exec();

		done();
	});
});
