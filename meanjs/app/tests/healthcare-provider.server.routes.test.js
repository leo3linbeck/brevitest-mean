'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	HealthcareProvider = mongoose.model('HealthcareProvider'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, healthcareProvider;

/**
 * Healthcare provider routes tests
 */
describe('Healthcare provider CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user to the test db and create new Healthcare provider
		user.save(function() {
			healthcareProvider = {
				name: 'Healthcare provider Name'
			};

			done();
		});
	});

	it('should be able to save Healthcare provider instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Healthcare provider
				agent.post('/healthcare-providers')
					.send(healthcareProvider)
					.expect(200)
					.end(function(healthcareProviderSaveErr, healthcareProviderSaveRes) {
						// Handle Healthcare provider save error
						if (healthcareProviderSaveErr) done(healthcareProviderSaveErr);

						// Get a list of Healthcare providers
						agent.get('/healthcare-providers')
							.end(function(healthcareProvidersGetErr, healthcareProvidersGetRes) {
								// Handle Healthcare provider save error
								if (healthcareProvidersGetErr) done(healthcareProvidersGetErr);

								// Get Healthcare providers list
								var healthcareProviders = healthcareProvidersGetRes.body;

								// Set assertions
								(healthcareProviders[0].user._id).should.equal(userId);
								(healthcareProviders[0].name).should.match('Healthcare provider Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Healthcare provider instance if not logged in', function(done) {
		agent.post('/healthcare-providers')
			.send(healthcareProvider)
			.expect(401)
			.end(function(healthcareProviderSaveErr, healthcareProviderSaveRes) {
				// Call the assertion callback
				done(healthcareProviderSaveErr);
			});
	});

	it('should not be able to save Healthcare provider instance if no name is provided', function(done) {
		// Invalidate name field
		healthcareProvider.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Healthcare provider
				agent.post('/healthcare-providers')
					.send(healthcareProvider)
					.expect(400)
					.end(function(healthcareProviderSaveErr, healthcareProviderSaveRes) {
						// Set message assertion
						(healthcareProviderSaveRes.body.message).should.match('Please fill Healthcare provider name');
						
						// Handle Healthcare provider save error
						done(healthcareProviderSaveErr);
					});
			});
	});

	it('should be able to update Healthcare provider instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Healthcare provider
				agent.post('/healthcare-providers')
					.send(healthcareProvider)
					.expect(200)
					.end(function(healthcareProviderSaveErr, healthcareProviderSaveRes) {
						// Handle Healthcare provider save error
						if (healthcareProviderSaveErr) done(healthcareProviderSaveErr);

						// Update Healthcare provider name
						healthcareProvider.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Healthcare provider
						agent.put('/healthcare-providers/' + healthcareProviderSaveRes.body._id)
							.send(healthcareProvider)
							.expect(200)
							.end(function(healthcareProviderUpdateErr, healthcareProviderUpdateRes) {
								// Handle Healthcare provider update error
								if (healthcareProviderUpdateErr) done(healthcareProviderUpdateErr);

								// Set assertions
								(healthcareProviderUpdateRes.body._id).should.equal(healthcareProviderSaveRes.body._id);
								(healthcareProviderUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Healthcare providers if not signed in', function(done) {
		// Create new Healthcare provider model instance
		var healthcareProviderObj = new HealthcareProvider(healthcareProvider);

		// Save the Healthcare provider
		healthcareProviderObj.save(function() {
			// Request Healthcare providers
			request(app).get('/healthcare-providers')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Healthcare provider if not signed in', function(done) {
		// Create new Healthcare provider model instance
		var healthcareProviderObj = new HealthcareProvider(healthcareProvider);

		// Save the Healthcare provider
		healthcareProviderObj.save(function() {
			request(app).get('/healthcare-providers/' + healthcareProviderObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', healthcareProvider.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Healthcare provider instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Healthcare provider
				agent.post('/healthcare-providers')
					.send(healthcareProvider)
					.expect(200)
					.end(function(healthcareProviderSaveErr, healthcareProviderSaveRes) {
						// Handle Healthcare provider save error
						if (healthcareProviderSaveErr) done(healthcareProviderSaveErr);

						// Delete existing Healthcare provider
						agent.delete('/healthcare-providers/' + healthcareProviderSaveRes.body._id)
							.send(healthcareProvider)
							.expect(200)
							.end(function(healthcareProviderDeleteErr, healthcareProviderDeleteRes) {
								// Handle Healthcare provider error error
								if (healthcareProviderDeleteErr) done(healthcareProviderDeleteErr);

								// Set assertions
								(healthcareProviderDeleteRes.body._id).should.equal(healthcareProviderSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Healthcare provider instance if not signed in', function(done) {
		// Set Healthcare provider user 
		healthcareProvider.user = user;

		// Create new Healthcare provider model instance
		var healthcareProviderObj = new HealthcareProvider(healthcareProvider);

		// Save the Healthcare provider
		healthcareProviderObj.save(function() {
			// Try deleting Healthcare provider
			request(app).delete('/healthcare-providers/' + healthcareProviderObj._id)
			.expect(401)
			.end(function(healthcareProviderDeleteErr, healthcareProviderDeleteRes) {
				// Set message assertion
				(healthcareProviderDeleteRes.body.message).should.match('User is not logged in');

				// Handle Healthcare provider error error
				done(healthcareProviderDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		HealthcareProvider.remove().exec();
		done();
	});
});