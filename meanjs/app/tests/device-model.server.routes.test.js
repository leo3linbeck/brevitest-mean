'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	DeviceModel = mongoose.model('DeviceModel'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, deviceModel;

/**
 * Device model routes tests
 */
describe('Device model CRUD tests', function() {
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
			provider: 'local',
			roles: ['user', 'admin', 'superuser']
		});

		// Save a user to the test db and create new Device model
		user.save(function() {
			deviceModel = {
				name: 'Device model Name'
			};

			done();
		});
	});

	it('should be able to save Device model instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device model
				agent.post('/device-models')
					.send(deviceModel)
					.expect(200)
					.end(function(deviceModelSaveErr, deviceModelSaveRes) {
						// Handle Device model save error
						if (deviceModelSaveErr) done(deviceModelSaveErr);

						// Get a list of Device models
						agent.get('/device-models')
							.end(function(deviceModelsGetErr, deviceModelsGetRes) {
								// Handle Device model save error
								if (deviceModelsGetErr) done(deviceModelsGetErr);

								// Get Device models list
								var deviceModels = deviceModelsGetRes.body;

								// Set assertions
								(deviceModels[0].user._id).should.equal(userId);
								(deviceModels[0].name).should.match('Device model Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Device model instance if not logged in', function(done) {
		agent.post('/device-models')
			.send(deviceModel)
			.expect(401)
			.end(function(deviceModelSaveErr, deviceModelSaveRes) {
				// Call the assertion callback
				done(deviceModelSaveErr);
			});
	});

	it('should not be able to save Device model instance if no name is provided', function(done) {
		// Invalidate name field
		deviceModel.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device model
				agent.post('/device-models')
					.send(deviceModel)
					.expect(400)
					.end(function(deviceModelSaveErr, deviceModelSaveRes) {
						// Set message assertion
						(deviceModelSaveRes.body.message).should.match('Please fill Device model name');
						
						// Handle Device model save error
						done(deviceModelSaveErr);
					});
			});
	});

	it('should be able to update Device model instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device model
				agent.post('/device-models')
					.send(deviceModel)
					.expect(200)
					.end(function(deviceModelSaveErr, deviceModelSaveRes) {
						// Handle Device model save error
						if (deviceModelSaveErr) done(deviceModelSaveErr);

						// Update Device model name
						deviceModel.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Device model
						agent.put('/device-models/' + deviceModelSaveRes.body._id)
							.send(deviceModel)
							.expect(200)
							.end(function(deviceModelUpdateErr, deviceModelUpdateRes) {
								// Handle Device model update error
								if (deviceModelUpdateErr) done(deviceModelUpdateErr);

								// Set assertions
								(deviceModelUpdateRes.body._id).should.equal(deviceModelSaveRes.body._id);
								(deviceModelUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to get a list of Device models if not signed in', function(done) {
		// Create new Device model model instance
		var deviceModelObj = new DeviceModel(deviceModel);

		// Save the Device model
		deviceModelObj.save(function() {
			// Request Device models
			request(app).get('/device-models')
                .expect(401)
				.end(function(req, res) {
					// Set assertion
                    (res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Device model if not signed in', function(done) {
		// Create new Device model model instance
		var deviceModelObj = new DeviceModel(deviceModel);

		// Save the Device model
		deviceModelObj.save(function() {
			request(app).get('/device-models/' + deviceModelObj._id)
                .expect(401)
				.end(function(req, res) {
					// Set assertion
                    (res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Device model instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Device model
				agent.post('/device-models')
					.send(deviceModel)
					.expect(200)
					.end(function(deviceModelSaveErr, deviceModelSaveRes) {
						// Handle Device model save error
						if (deviceModelSaveErr) done(deviceModelSaveErr);

						// Delete existing Device model
						agent.delete('/device-models/' + deviceModelSaveRes.body._id)
							.send(deviceModel)
							.expect(200)
							.end(function(deviceModelDeleteErr, deviceModelDeleteRes) {
								// Handle Device model error error
								if (deviceModelDeleteErr) done(deviceModelDeleteErr);

								// Set assertions
								(deviceModelDeleteRes.body._id).should.equal(deviceModelSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Device model instance if not signed in', function(done) {
		// Set Device model user 
		deviceModel.user = user;

		// Create new Device model model instance
		var deviceModelObj = new DeviceModel(deviceModel);

		// Save the Device model
		deviceModelObj.save(function() {
			// Try deleting Device model
			request(app).delete('/device-models/' + deviceModelObj._id)
			.expect(401)
			.end(function(deviceModelDeleteErr, deviceModelDeleteRes) {
				// Set message assertion
				(deviceModelDeleteRes.body.message).should.match('User is not logged in');

				// Handle Device model error error
				done(deviceModelDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		DeviceModel.remove().exec();
		done();
	});
});
