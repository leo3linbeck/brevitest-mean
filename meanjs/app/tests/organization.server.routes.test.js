'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Organization = mongoose.model('Organization'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, organization;

/**
 * Organization routes tests
 */
describe('Organization CRUD tests', function() {
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

		// Save a user to the test db and create new Organization
		user.save(function() {
			organization = {
				name: 'Organization Name'
			};

			done();
		});
	});

	it('should be able to save Organization instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Organization
				agent.post('/organizations')
					.send(organization)
					.expect(200)
					.end(function(organizationSaveErr, organizationSaveRes) {
						// Handle Organization save error
						if (organizationSaveErr) done(organizationSaveErr);

						// Get a list of Organizations
						agent.get('/organizations')
							.end(function(organizationsGetErr, organizationsGetRes) {
								// Handle Organization save error
								if (organizationsGetErr) done(organizationsGetErr);

								// Get Organizations list
								var organizations = organizationsGetRes.body;

								// Set assertions
								(organizations[0].user._id).should.equal(userId);
								(organizations[0].name).should.match('Organization Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Organization instance if not logged in', function(done) {
		agent.post('/organizations')
			.send(organization)
			.expect(401)
			.end(function(organizationSaveErr, organizationSaveRes) {
				// Call the assertion callback
				done(organizationSaveErr);
			});
	});

	it('should not be able to save Organization instance if no name is provided', function(done) {
		// Invalidate name field
		organization.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Organization
				agent.post('/organizations')
					.send(organization)
					.expect(400)
					.end(function(organizationSaveErr, organizationSaveRes) {
						// Set message assertion
						(organizationSaveRes.body.message).should.match('Please fill Organization name');
						
						// Handle Organization save error
						done(organizationSaveErr);
					});
			});
	});

	it('should be able to update Organization instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Organization
				agent.post('/organizations')
					.send(organization)
					.expect(200)
					.end(function(organizationSaveErr, organizationSaveRes) {
						// Handle Organization save error
						if (organizationSaveErr) done(organizationSaveErr);

						// Update Organization name
						organization.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Organization
						agent.put('/organizations/' + organizationSaveRes.body._id)
							.send(organization)
							.expect(200)
							.end(function(organizationUpdateErr, organizationUpdateRes) {
								// Handle Organization update error
								if (organizationUpdateErr) done(organizationUpdateErr);

								// Set assertions
								(organizationUpdateRes.body._id).should.equal(organizationSaveRes.body._id);
								(organizationUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Organizations if not signed in', function(done) {
		// Create new Organization model instance
		var organizationObj = new Organization(organization);

		// Save the Organization
		organizationObj.save(function() {
			// Request Organizations
			request(app).get('/organizations')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Organization if not signed in', function(done) {
		// Create new Organization model instance
		var organizationObj = new Organization(organization);

		// Save the Organization
		organizationObj.save(function() {
			request(app).get('/organizations/' + organizationObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', organization.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Organization instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Organization
				agent.post('/organizations')
					.send(organization)
					.expect(200)
					.end(function(organizationSaveErr, organizationSaveRes) {
						// Handle Organization save error
						if (organizationSaveErr) done(organizationSaveErr);

						// Delete existing Organization
						agent.delete('/organizations/' + organizationSaveRes.body._id)
							.send(organization)
							.expect(200)
							.end(function(organizationDeleteErr, organizationDeleteRes) {
								// Handle Organization error error
								if (organizationDeleteErr) done(organizationDeleteErr);

								// Set assertions
								(organizationDeleteRes.body._id).should.equal(organizationSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Organization instance if not signed in', function(done) {
		// Set Organization user 
		organization.user = user;

		// Create new Organization model instance
		var organizationObj = new Organization(organization);

		// Save the Organization
		organizationObj.save(function() {
			// Try deleting Organization
			request(app).delete('/organizations/' + organizationObj._id)
			.expect(401)
			.end(function(organizationDeleteErr, organizationDeleteRes) {
				// Set message assertion
				(organizationDeleteRes.body.message).should.match('User is not logged in');

				// Handle Organization error error
				done(organizationDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Organization.remove().exec();
		done();
	});
});