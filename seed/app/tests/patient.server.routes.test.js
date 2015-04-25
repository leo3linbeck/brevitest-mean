'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Patient = mongoose.model('Patient'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, patient;

/**
 * Patient routes tests
 */
describe('Patient CRUD tests', function() {
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

		// Save a user to the test db and create new Patient
		user.save(function() {
			patient = {
				name: 'Patient Name'
			};

			done();
		});
	});

	it('should be able to save Patient instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Patient
				agent.post('/patients')
					.send(patient)
					.expect(200)
					.end(function(patientSaveErr, patientSaveRes) {
						// Handle Patient save error
						if (patientSaveErr) done(patientSaveErr);

						// Get a list of Patients
						agent.get('/patients')
							.end(function(patientsGetErr, patientsGetRes) {
								// Handle Patient save error
								if (patientsGetErr) done(patientsGetErr);

								// Get Patients list
								var patients = patientsGetRes.body;

								// Set assertions
								(patients[0].user._id).should.equal(userId);
								(patients[0].name).should.match('Patient Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Patient instance if not logged in', function(done) {
		agent.post('/patients')
			.send(patient)
			.expect(401)
			.end(function(patientSaveErr, patientSaveRes) {
				// Call the assertion callback
				done(patientSaveErr);
			});
	});

	it('should not be able to save Patient instance if no name is provided', function(done) {
		// Invalidate name field
		patient.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Patient
				agent.post('/patients')
					.send(patient)
					.expect(400)
					.end(function(patientSaveErr, patientSaveRes) {
						// Set message assertion
						(patientSaveRes.body.message).should.match('Please fill Patient name');
						
						// Handle Patient save error
						done(patientSaveErr);
					});
			});
	});

	it('should be able to update Patient instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Patient
				agent.post('/patients')
					.send(patient)
					.expect(200)
					.end(function(patientSaveErr, patientSaveRes) {
						// Handle Patient save error
						if (patientSaveErr) done(patientSaveErr);

						// Update Patient name
						patient.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Patient
						agent.put('/patients/' + patientSaveRes.body._id)
							.send(patient)
							.expect(200)
							.end(function(patientUpdateErr, patientUpdateRes) {
								// Handle Patient update error
								if (patientUpdateErr) done(patientUpdateErr);

								// Set assertions
								(patientUpdateRes.body._id).should.equal(patientSaveRes.body._id);
								(patientUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Patients if not signed in', function(done) {
		// Create new Patient model instance
		var patientObj = new Patient(patient);

		// Save the Patient
		patientObj.save(function() {
			// Request Patients
			request(app).get('/patients')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Patient if not signed in', function(done) {
		// Create new Patient model instance
		var patientObj = new Patient(patient);

		// Save the Patient
		patientObj.save(function() {
			request(app).get('/patients/' + patientObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', patient.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Patient instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Patient
				agent.post('/patients')
					.send(patient)
					.expect(200)
					.end(function(patientSaveErr, patientSaveRes) {
						// Handle Patient save error
						if (patientSaveErr) done(patientSaveErr);

						// Delete existing Patient
						agent.delete('/patients/' + patientSaveRes.body._id)
							.send(patient)
							.expect(200)
							.end(function(patientDeleteErr, patientDeleteRes) {
								// Handle Patient error error
								if (patientDeleteErr) done(patientDeleteErr);

								// Set assertions
								(patientDeleteRes.body._id).should.equal(patientSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Patient instance if not signed in', function(done) {
		// Set Patient user 
		patient.user = user;

		// Create new Patient model instance
		var patientObj = new Patient(patient);

		// Save the Patient
		patientObj.save(function() {
			// Try deleting Patient
			request(app).delete('/patients/' + patientObj._id)
			.expect(401)
			.end(function(patientDeleteErr, patientDeleteRes) {
				// Set message assertion
				(patientDeleteRes.body.message).should.match('User is not logged in');

				// Handle Patient error error
				done(patientDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Patient.remove().exec();
		done();
	});
});