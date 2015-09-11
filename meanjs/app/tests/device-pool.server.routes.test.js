'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	DevicePool = mongoose.model('DevicePool'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, devicePool;

/**
 * Device pool routes tests
 */
describe('Device pool CRUD tests', function() {
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

		// Save a user to the test db and create new Device pool
		user.save(function() {
			devicePool = {
				name: 'Device pool Name'
			};

			done();
		});
	});

	it('should be able to save Device pool instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device pool
				agent.post('/device-pools')
					.send(devicePool)
					.expect(200)
					.end(function(devicePoolSaveErr, devicePoolSaveRes) {
						// Handle Device pool save error
						if (devicePoolSaveErr) done(devicePoolSaveErr);

						// Get a list of Device pools
						agent.get('/device-pools')
							.end(function(devicePoolsGetErr, devicePoolsGetRes) {
								// Handle Device pool save error
								if (devicePoolsGetErr) done(devicePoolsGetErr);

								// Get Device pools list
								var devicePools = devicePoolsGetRes.body;

								// Set assertions
								(devicePools[0].user._id).should.equal(userId);
								(devicePools[0].name).should.match('Device pool Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Device pool instance if not logged in', function(done) {
		agent.post('/device-pools')
			.send(devicePool)
			.expect(401)
			.end(function(devicePoolSaveErr, devicePoolSaveRes) {
				// Call the assertion callback
				done(devicePoolSaveErr);
			});
	});

	it('should not be able to save Device pool instance if no name is provided', function(done) {
		// Invalidate name field
		devicePool.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device pool
				agent.post('/device-pools')
					.send(devicePool)
					.expect(400)
					.end(function(devicePoolSaveErr, devicePoolSaveRes) {
						// Set message assertion
						(devicePoolSaveRes.body.message).should.match('Please fill Device pool name');

						// Handle Device pool save error
						done(devicePoolSaveErr);
					});
			});
	});

	it('should be able to update Device pool instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device pool
				agent.post('/device-pools')
					.send(devicePool)
					.expect(200)
					.end(function(devicePoolSaveErr, devicePoolSaveRes) {
						// Handle Device pool save error
						if (devicePoolSaveErr) done(devicePoolSaveErr);

						// Update Device pool name
						devicePool.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Device pool
						agent.put('/device-pools/' + devicePoolSaveRes.body._id)
							.send(devicePool)
							.expect(200)
							.end(function(devicePoolUpdateErr, devicePoolUpdateRes) {
								// Handle Device pool update error
								if (devicePoolUpdateErr) done(devicePoolUpdateErr);

								// Set assertions
								(devicePoolUpdateRes.body._id).should.equal(devicePoolSaveRes.body._id);
								(devicePoolUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Device pools if not signed in', function(done) {
		// Create new Device pool model instance
		var devicePoolObj = new DevicePool(devicePool);

		// Save the Device pool
		devicePoolObj.save(function() {
			// Request Device pools
			request(app).get('/device-pools')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array();

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Device pool if not signed in', function(done) {
		// Create new Device pool model instance
		var devicePoolObj = new DevicePool(devicePool);

		// Save the Device pool
		devicePoolObj.save(function() {
			request(app).get('/device-pools/' + devicePoolObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', devicePool.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Device pool instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device pool
				agent.post('/device-pools')
					.send(devicePool)
					.expect(200)
					.end(function(devicePoolSaveErr, devicePoolSaveRes) {
						// Handle Device pool save error
						if (devicePoolSaveErr) done(devicePoolSaveErr);

						// Delete existing Device pool
						agent.delete('/device-pools/' + devicePoolSaveRes.body._id)
							.send(devicePool)
							.expect(200)
							.end(function(devicePoolDeleteErr, devicePoolDeleteRes) {
								// Handle Device pool error error
								if (devicePoolDeleteErr) done(devicePoolDeleteErr);

								// Set assertions
								(devicePoolDeleteRes.body._id).should.equal(devicePoolSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Device pool instance if not signed in', function(done) {
		// Set Device pool user
		devicePool.user = user;

		// Create new Device pool model instance
		var devicePoolObj = new DevicePool(devicePool);

		// Save the Device pool
		devicePoolObj.save(function() {
			// Try deleting Device pool
			request(app).delete('/device-pools/' + devicePoolObj._id)
			.expect(401)
			.end(function(devicePoolDeleteErr, devicePoolDeleteRes) {
				// Set message assertion
				(devicePoolDeleteRes.body.message).should.match('User is not logged in');

				// Handle Device pool error error
				done(devicePoolDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		DevicePool.remove().exec();
		done();
	});
});
