'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	FirmwareTest = mongoose.model('FirmwareTest'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, firmwareTest;

/**
 * Firmware test routes tests
 */
describe('Firmware test CRUD tests', function() {
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

		// Save a user to the test db and create new Firmware test
		user.save(function() {
			firmwareTest = {
				name: 'Firmware test Name'
			};

			done();
		});
	});

	it('should be able to save Firmware test instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Firmware test
				agent.post('/firmware-tests')
					.send(firmwareTest)
					.expect(200)
					.end(function(firmwareTestSaveErr, firmwareTestSaveRes) {
						// Handle Firmware test save error
						if (firmwareTestSaveErr) done(firmwareTestSaveErr);

						// Get a list of Firmware tests
						agent.get('/firmware-tests')
							.end(function(firmwareTestsGetErr, firmwareTestsGetRes) {
								// Handle Firmware test save error
								if (firmwareTestsGetErr) done(firmwareTestsGetErr);

								// Get Firmware tests list
								var firmwareTests = firmwareTestsGetRes.body;

								// Set assertions
								(firmwareTests[0].user._id).should.equal(userId);
								(firmwareTests[0].name).should.match('Firmware test Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Firmware test instance if not logged in', function(done) {
		agent.post('/firmware-tests')
			.send(firmwareTest)
			.expect(401)
			.end(function(firmwareTestSaveErr, firmwareTestSaveRes) {
				// Call the assertion callback
				done(firmwareTestSaveErr);
			});
	});

	it('should not be able to save Firmware test instance if no name is provided', function(done) {
		// Invalidate name field
		firmwareTest.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Firmware test
				agent.post('/firmware-tests')
					.send(firmwareTest)
					.expect(400)
					.end(function(firmwareTestSaveErr, firmwareTestSaveRes) {
						// Set message assertion
						(firmwareTestSaveRes.body.message).should.match('Please fill Firmware test name');
						
						// Handle Firmware test save error
						done(firmwareTestSaveErr);
					});
			});
	});

	it('should be able to update Firmware test instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Firmware test
				agent.post('/firmware-tests')
					.send(firmwareTest)
					.expect(200)
					.end(function(firmwareTestSaveErr, firmwareTestSaveRes) {
						// Handle Firmware test save error
						if (firmwareTestSaveErr) done(firmwareTestSaveErr);

						// Update Firmware test name
						firmwareTest.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Firmware test
						agent.put('/firmware-tests/' + firmwareTestSaveRes.body._id)
							.send(firmwareTest)
							.expect(200)
							.end(function(firmwareTestUpdateErr, firmwareTestUpdateRes) {
								// Handle Firmware test update error
								if (firmwareTestUpdateErr) done(firmwareTestUpdateErr);

								// Set assertions
								(firmwareTestUpdateRes.body._id).should.equal(firmwareTestSaveRes.body._id);
								(firmwareTestUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Firmware tests if not signed in', function(done) {
		// Create new Firmware test model instance
		var firmwareTestObj = new FirmwareTest(firmwareTest);

		// Save the Firmware test
		firmwareTestObj.save(function() {
			// Request Firmware tests
			request(app).get('/firmware-tests')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Firmware test if not signed in', function(done) {
		// Create new Firmware test model instance
		var firmwareTestObj = new FirmwareTest(firmwareTest);

		// Save the Firmware test
		firmwareTestObj.save(function() {
			request(app).get('/firmware-tests/' + firmwareTestObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', firmwareTest.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Firmware test instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Firmware test
				agent.post('/firmware-tests')
					.send(firmwareTest)
					.expect(200)
					.end(function(firmwareTestSaveErr, firmwareTestSaveRes) {
						// Handle Firmware test save error
						if (firmwareTestSaveErr) done(firmwareTestSaveErr);

						// Delete existing Firmware test
						agent.delete('/firmware-tests/' + firmwareTestSaveRes.body._id)
							.send(firmwareTest)
							.expect(200)
							.end(function(firmwareTestDeleteErr, firmwareTestDeleteRes) {
								// Handle Firmware test error error
								if (firmwareTestDeleteErr) done(firmwareTestDeleteErr);

								// Set assertions
								(firmwareTestDeleteRes.body._id).should.equal(firmwareTestSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Firmware test instance if not signed in', function(done) {
		// Set Firmware test user 
		firmwareTest.user = user;

		// Create new Firmware test model instance
		var firmwareTestObj = new FirmwareTest(firmwareTest);

		// Save the Firmware test
		firmwareTestObj.save(function() {
			// Try deleting Firmware test
			request(app).delete('/firmware-tests/' + firmwareTestObj._id)
			.expect(401)
			.end(function(firmwareTestDeleteErr, firmwareTestDeleteRes) {
				// Set message assertion
				(firmwareTestDeleteRes.body.message).should.match('User is not logged in');

				// Handle Firmware test error error
				done(firmwareTestDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		FirmwareTest.remove().exec();
		done();
	});
});