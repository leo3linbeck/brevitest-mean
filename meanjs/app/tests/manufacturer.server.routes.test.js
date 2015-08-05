'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Manufacturer = mongoose.model('Manufacturer'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, manufacturer;

/**
 * Manufacturer routes tests
 */
describe('Manufacturer CRUD tests', function() {
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

		// Save a user to the test db and create new Manufacturer
		user.save(function() {
			manufacturer = {
				name: 'Manufacturer Name'
			};

			done();
		});
	});

	it('should be able to save Manufacturer instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Manufacturer
				agent.post('/manufacturers')
					.send(manufacturer)
					.expect(200)
					.end(function(manufacturerSaveErr, manufacturerSaveRes) {
						// Handle Manufacturer save error
						if (manufacturerSaveErr) done(manufacturerSaveErr);

						// Get a list of Manufacturers
						agent.get('/manufacturers')
							.end(function(manufacturersGetErr, manufacturersGetRes) {
								// Handle Manufacturer save error
								if (manufacturersGetErr) done(manufacturersGetErr);

								// Get Manufacturers list
								var manufacturers = manufacturersGetRes.body;

								// Set assertions
								(manufacturers[0].user._id).should.equal(userId);
								(manufacturers[0].name).should.match('Manufacturer Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Manufacturer instance if not logged in', function(done) {
		agent.post('/manufacturers')
			.send(manufacturer)
			.expect(401)
			.end(function(manufacturerSaveErr, manufacturerSaveRes) {
				// Call the assertion callback
				done(manufacturerSaveErr);
			});
	});

	it('should not be able to save Manufacturer instance if no name is provided', function(done) {
		// Invalidate name field
		manufacturer.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Manufacturer
				agent.post('/manufacturers')
					.send(manufacturer)
					.expect(400)
					.end(function(manufacturerSaveErr, manufacturerSaveRes) {
						// Set message assertion
						(manufacturerSaveRes.body.message).should.match('Please fill Manufacturer name');
						
						// Handle Manufacturer save error
						done(manufacturerSaveErr);
					});
			});
	});

	it('should be able to update Manufacturer instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Manufacturer
				agent.post('/manufacturers')
					.send(manufacturer)
					.expect(200)
					.end(function(manufacturerSaveErr, manufacturerSaveRes) {
						// Handle Manufacturer save error
						if (manufacturerSaveErr) done(manufacturerSaveErr);

						// Update Manufacturer name
						manufacturer.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Manufacturer
						agent.put('/manufacturers/' + manufacturerSaveRes.body._id)
							.send(manufacturer)
							.expect(200)
							.end(function(manufacturerUpdateErr, manufacturerUpdateRes) {
								// Handle Manufacturer update error
								if (manufacturerUpdateErr) done(manufacturerUpdateErr);

								// Set assertions
								(manufacturerUpdateRes.body._id).should.equal(manufacturerSaveRes.body._id);
								(manufacturerUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Manufacturers if not signed in', function(done) {
		// Create new Manufacturer model instance
		var manufacturerObj = new Manufacturer(manufacturer);

		// Save the Manufacturer
		manufacturerObj.save(function() {
			// Request Manufacturers
			request(app).get('/manufacturers')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Manufacturer if not signed in', function(done) {
		// Create new Manufacturer model instance
		var manufacturerObj = new Manufacturer(manufacturer);

		// Save the Manufacturer
		manufacturerObj.save(function() {
			request(app).get('/manufacturers/' + manufacturerObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', manufacturer.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Manufacturer instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Manufacturer
				agent.post('/manufacturers')
					.send(manufacturer)
					.expect(200)
					.end(function(manufacturerSaveErr, manufacturerSaveRes) {
						// Handle Manufacturer save error
						if (manufacturerSaveErr) done(manufacturerSaveErr);

						// Delete existing Manufacturer
						agent.delete('/manufacturers/' + manufacturerSaveRes.body._id)
							.send(manufacturer)
							.expect(200)
							.end(function(manufacturerDeleteErr, manufacturerDeleteRes) {
								// Handle Manufacturer error error
								if (manufacturerDeleteErr) done(manufacturerDeleteErr);

								// Set assertions
								(manufacturerDeleteRes.body._id).should.equal(manufacturerSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Manufacturer instance if not signed in', function(done) {
		// Set Manufacturer user 
		manufacturer.user = user;

		// Create new Manufacturer model instance
		var manufacturerObj = new Manufacturer(manufacturer);

		// Save the Manufacturer
		manufacturerObj.save(function() {
			// Try deleting Manufacturer
			request(app).delete('/manufacturers/' + manufacturerObj._id)
			.expect(401)
			.end(function(manufacturerDeleteErr, manufacturerDeleteRes) {
				// Set message assertion
				(manufacturerDeleteRes.body.message).should.match('User is not logged in');

				// Handle Manufacturer error error
				done(manufacturerDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Manufacturer.remove().exec();
		done();
	});
});
