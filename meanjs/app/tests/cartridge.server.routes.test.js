'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Cartridge = mongoose.model('Cartridge'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, cartridge;

/**
 * Cartridge routes tests
 */
describe('Cartridge CRUD tests', function() {
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

		// Save a user to the test db and create new Cartridge
		user.save(function() {
			cartridge = {
				name: 'Cartridge Name'
			};

			done();
		});
	});

	it('should be able to save Cartridge instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Cartridge
				agent.post('/cartridges')
					.send(cartridge)
					.expect(200)
					.end(function(cartridgeSaveErr, cartridgeSaveRes) {
						// Handle Cartridge save error
						if (cartridgeSaveErr) done(cartridgeSaveErr);

						// Get a list of Cartridges
						agent.get('/cartridges')
							.end(function(cartridgesGetErr, cartridgesGetRes) {
								// Handle Cartridge save error
								if (cartridgesGetErr) done(cartridgesGetErr);

								// Get Cartridges list
								var cartridges = cartridgesGetRes.body;

								// Set assertions
								(cartridges[0].user._id).should.equal(userId);
								(cartridges[0].name).should.match('Cartridge Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Cartridge instance if not logged in', function(done) {
		agent.post('/cartridges')
			.send(cartridge)
			.expect(401)
			.end(function(cartridgeSaveErr, cartridgeSaveRes) {
				// Call the assertion callback
				done(cartridgeSaveErr);
			});
	});

	it('should not be able to save Cartridge instance if no name is provided', function(done) {
		// Invalidate name field
		cartridge.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Cartridge
				agent.post('/cartridges')
					.send(cartridge)
					.expect(400)
					.end(function(cartridgeSaveErr, cartridgeSaveRes) {
						// Set message assertion
						(cartridgeSaveRes.body.message).should.match('Please fill Cartridge name');
						
						// Handle Cartridge save error
						done(cartridgeSaveErr);
					});
			});
	});

	it('should be able to update Cartridge instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Cartridge
				agent.post('/cartridges')
					.send(cartridge)
					.expect(200)
					.end(function(cartridgeSaveErr, cartridgeSaveRes) {
						// Handle Cartridge save error
						if (cartridgeSaveErr) done(cartridgeSaveErr);

						// Update Cartridge name
						cartridge.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Cartridge
						agent.put('/cartridges/' + cartridgeSaveRes.body._id)
							.send(cartridge)
							.expect(200)
							.end(function(cartridgeUpdateErr, cartridgeUpdateRes) {
								// Handle Cartridge update error
								if (cartridgeUpdateErr) done(cartridgeUpdateErr);

								// Set assertions
								(cartridgeUpdateRes.body._id).should.equal(cartridgeSaveRes.body._id);
								(cartridgeUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Cartridges if not signed in', function(done) {
		// Create new Cartridge model instance
		var cartridgeObj = new Cartridge(cartridge);

		// Save the Cartridge
		cartridgeObj.save(function() {
			// Request Cartridges
			request(app).get('/cartridges')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Cartridge if not signed in', function(done) {
		// Create new Cartridge model instance
		var cartridgeObj = new Cartridge(cartridge);

		// Save the Cartridge
		cartridgeObj.save(function() {
			request(app).get('/cartridges/' + cartridgeObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', cartridge.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Cartridge instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Cartridge
				agent.post('/cartridges')
					.send(cartridge)
					.expect(200)
					.end(function(cartridgeSaveErr, cartridgeSaveRes) {
						// Handle Cartridge save error
						if (cartridgeSaveErr) done(cartridgeSaveErr);

						// Delete existing Cartridge
						agent.delete('/cartridges/' + cartridgeSaveRes.body._id)
							.send(cartridge)
							.expect(200)
							.end(function(cartridgeDeleteErr, cartridgeDeleteRes) {
								// Handle Cartridge error error
								if (cartridgeDeleteErr) done(cartridgeDeleteErr);

								// Set assertions
								(cartridgeDeleteRes.body._id).should.equal(cartridgeSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Cartridge instance if not signed in', function(done) {
		// Set Cartridge user 
		cartridge.user = user;

		// Create new Cartridge model instance
		var cartridgeObj = new Cartridge(cartridge);

		// Save the Cartridge
		cartridgeObj.save(function() {
			// Try deleting Cartridge
			request(app).delete('/cartridges/' + cartridgeObj._id)
			.expect(401)
			.end(function(cartridgeDeleteErr, cartridgeDeleteRes) {
				// Set message assertion
				(cartridgeDeleteRes.body.message).should.match('User is not logged in');

				// Handle Cartridge error error
				done(cartridgeDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Cartridge.remove().exec();
		done();
	});
});