'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Prescription = mongoose.model('Prescription'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, prescription;

/**
 * Prescription routes tests
 */
describe('Prescription CRUD tests', function() {
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

		// Save a user to the test db and create new Prescription
		user.save(function() {
			prescription = {
				name: 'Prescription Name'
			};

			done();
		});
	});

	it('should be able to save Prescription instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Prescription
				agent.post('/prescriptions')
					.send(prescription)
					.expect(200)
					.end(function(prescriptionSaveErr, prescriptionSaveRes) {
						// Handle Prescription save error
						if (prescriptionSaveErr) done(prescriptionSaveErr);

						// Get a list of Prescriptions
						agent.get('/prescriptions')
							.end(function(prescriptionsGetErr, prescriptionsGetRes) {
								// Handle Prescription save error
								if (prescriptionsGetErr) done(prescriptionsGetErr);

								// Get Prescriptions list
								var prescriptions = prescriptionsGetRes.body;

								// Set assertions
								(prescriptions[0].user._id).should.equal(userId);
								(prescriptions[0].name).should.match('Prescription Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Prescription instance if not logged in', function(done) {
		agent.post('/prescriptions')
			.send(prescription)
			.expect(401)
			.end(function(prescriptionSaveErr, prescriptionSaveRes) {
				// Call the assertion callback
				done(prescriptionSaveErr);
			});
	});

	it('should not be able to save Prescription instance if no name is provided', function(done) {
		// Invalidate name field
		prescription.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Prescription
				agent.post('/prescriptions')
					.send(prescription)
					.expect(400)
					.end(function(prescriptionSaveErr, prescriptionSaveRes) {
						// Set message assertion
						(prescriptionSaveRes.body.message).should.match('Please fill Prescription name');
						
						// Handle Prescription save error
						done(prescriptionSaveErr);
					});
			});
	});

	it('should be able to update Prescription instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Prescription
				agent.post('/prescriptions')
					.send(prescription)
					.expect(200)
					.end(function(prescriptionSaveErr, prescriptionSaveRes) {
						// Handle Prescription save error
						if (prescriptionSaveErr) done(prescriptionSaveErr);

						// Update Prescription name
						prescription.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Prescription
						agent.put('/prescriptions/' + prescriptionSaveRes.body._id)
							.send(prescription)
							.expect(200)
							.end(function(prescriptionUpdateErr, prescriptionUpdateRes) {
								// Handle Prescription update error
								if (prescriptionUpdateErr) done(prescriptionUpdateErr);

								// Set assertions
								(prescriptionUpdateRes.body._id).should.equal(prescriptionSaveRes.body._id);
								(prescriptionUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Prescriptions if not signed in', function(done) {
		// Create new Prescription model instance
		var prescriptionObj = new Prescription(prescription);

		// Save the Prescription
		prescriptionObj.save(function() {
			// Request Prescriptions
			request(app).get('/prescriptions')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Prescription if not signed in', function(done) {
		// Create new Prescription model instance
		var prescriptionObj = new Prescription(prescription);

		// Save the Prescription
		prescriptionObj.save(function() {
			request(app).get('/prescriptions/' + prescriptionObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', prescription.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Prescription instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Prescription
				agent.post('/prescriptions')
					.send(prescription)
					.expect(200)
					.end(function(prescriptionSaveErr, prescriptionSaveRes) {
						// Handle Prescription save error
						if (prescriptionSaveErr) done(prescriptionSaveErr);

						// Delete existing Prescription
						agent.delete('/prescriptions/' + prescriptionSaveRes.body._id)
							.send(prescription)
							.expect(200)
							.end(function(prescriptionDeleteErr, prescriptionDeleteRes) {
								// Handle Prescription error error
								if (prescriptionDeleteErr) done(prescriptionDeleteErr);

								// Set assertions
								(prescriptionDeleteRes.body._id).should.equal(prescriptionSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Prescription instance if not signed in', function(done) {
		// Set Prescription user 
		prescription.user = user;

		// Create new Prescription model instance
		var prescriptionObj = new Prescription(prescription);

		// Save the Prescription
		prescriptionObj.save(function() {
			// Try deleting Prescription
			request(app).delete('/prescriptions/' + prescriptionObj._id)
			.expect(401)
			.end(function(prescriptionDeleteErr, prescriptionDeleteRes) {
				// Set message assertion
				(prescriptionDeleteRes.body.message).should.match('User is not logged in');

				// Handle Prescription error error
				done(prescriptionDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Prescription.remove().exec();
		done();
	});
});