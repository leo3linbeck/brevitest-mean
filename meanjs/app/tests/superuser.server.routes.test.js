'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Superuser = mongoose.model('Superuser'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, superuser;

/**
 * Superuser routes tests
 */
describe('Superuser CRUD tests', function() {
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

		// Save a user to the test db and create new Superuser
		user.save(function() {
			superuser = {
				name: 'Superuser Name'
			};

			done();
		});
	});

	it('should be able to save Superuser instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Superuser
				agent.post('/superusers')
					.send(superuser)
					.expect(200)
					.end(function(superuserSaveErr, superuserSaveRes) {
						// Handle Superuser save error
						if (superuserSaveErr) done(superuserSaveErr);

						// Get a list of Superusers
						agent.get('/superusers')
							.end(function(superusersGetErr, superusersGetRes) {
								// Handle Superuser save error
								if (superusersGetErr) done(superusersGetErr);

								// Get Superusers list
								var superusers = superusersGetRes.body;

								// Set assertions
								(superusers[0].user._id).should.equal(userId);
								(superusers[0].name).should.match('Superuser Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Superuser instance if not logged in', function(done) {
		agent.post('/superusers')
			.send(superuser)
			.expect(401)
			.end(function(superuserSaveErr, superuserSaveRes) {
				// Call the assertion callback
				done(superuserSaveErr);
			});
	});

	it('should not be able to save Superuser instance if no name is provided', function(done) {
		// Invalidate name field
		superuser.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Superuser
				agent.post('/superusers')
					.send(superuser)
					.expect(400)
					.end(function(superuserSaveErr, superuserSaveRes) {
						// Set message assertion
						(superuserSaveRes.body.message).should.match('Please fill Superuser name');
						
						// Handle Superuser save error
						done(superuserSaveErr);
					});
			});
	});

	it('should be able to update Superuser instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Superuser
				agent.post('/superusers')
					.send(superuser)
					.expect(200)
					.end(function(superuserSaveErr, superuserSaveRes) {
						// Handle Superuser save error
						if (superuserSaveErr) done(superuserSaveErr);

						// Update Superuser name
						superuser.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Superuser
						agent.put('/superusers/' + superuserSaveRes.body._id)
							.send(superuser)
							.expect(200)
							.end(function(superuserUpdateErr, superuserUpdateRes) {
								// Handle Superuser update error
								if (superuserUpdateErr) done(superuserUpdateErr);

								// Set assertions
								(superuserUpdateRes.body._id).should.equal(superuserSaveRes.body._id);
								(superuserUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Superusers if not signed in', function(done) {
		// Create new Superuser model instance
		var superuserObj = new Superuser(superuser);

		// Save the Superuser
		superuserObj.save(function() {
			// Request Superusers
			request(app).get('/superusers')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Superuser if not signed in', function(done) {
		// Create new Superuser model instance
		var superuserObj = new Superuser(superuser);

		// Save the Superuser
		superuserObj.save(function() {
			request(app).get('/superusers/' + superuserObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', superuser.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Superuser instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Superuser
				agent.post('/superusers')
					.send(superuser)
					.expect(200)
					.end(function(superuserSaveErr, superuserSaveRes) {
						// Handle Superuser save error
						if (superuserSaveErr) done(superuserSaveErr);

						// Delete existing Superuser
						agent.delete('/superusers/' + superuserSaveRes.body._id)
							.send(superuser)
							.expect(200)
							.end(function(superuserDeleteErr, superuserDeleteRes) {
								// Handle Superuser error error
								if (superuserDeleteErr) done(superuserDeleteErr);

								// Set assertions
								(superuserDeleteRes.body._id).should.equal(superuserSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Superuser instance if not signed in', function(done) {
		// Set Superuser user 
		superuser.user = user;

		// Create new Superuser model instance
		var superuserObj = new Superuser(superuser);

		// Save the Superuser
		superuserObj.save(function() {
			// Try deleting Superuser
			request(app).delete('/superusers/' + superuserObj._id)
			.expect(401)
			.end(function(superuserDeleteErr, superuserDeleteRes) {
				// Set message assertion
				(superuserDeleteRes.body.message).should.match('User is not logged in');

				// Handle Superuser error error
				done(superuserDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Superuser.remove().exec();
		done();
	});
});