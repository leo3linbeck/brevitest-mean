'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Assay = mongoose.model('Assay'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, assay;

/**
 * Assay routes tests
 */
describe('Assay CRUD tests', function() {
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

		// Save a user to the test db and create new Assay
		user.save(function() {
			assay = {
				name: 'Assay Name'
			};

			done();
		});
	});

	it('should be able to save Assay instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Assay
				agent.post('/assays')
					.send(assay)
					.expect(200)
					.end(function(assaySaveErr, assaySaveRes) {
						// Handle Assay save error
						if (assaySaveErr) done(assaySaveErr);

						// Get a list of Assays
						agent.get('/assays')
							.end(function(assaysGetErr, assaysGetRes) {
								// Handle Assay save error
								if (assaysGetErr) done(assaysGetErr);

								// Get Assays list
								var assays = assaysGetRes.body;

								// Set assertions
								(assays[0].user._id).should.equal(userId);
								(assays[0].name).should.match('Assay Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Assay instance if not logged in', function(done) {
		agent.post('/assays')
			.send(assay)
			.expect(401)
			.end(function(assaySaveErr, assaySaveRes) {
				// Call the assertion callback
				done(assaySaveErr);
			});
	});

	it('should not be able to save Assay instance if no name is provided', function(done) {
		// Invalidate name field
		assay.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Assay
				agent.post('/assays')
					.send(assay)
					.expect(400)
					.end(function(assaySaveErr, assaySaveRes) {
						// Set message assertion
						(assaySaveRes.body.message).should.match('Please fill Assay name');
						
						// Handle Assay save error
						done(assaySaveErr);
					});
			});
	});

	it('should be able to update Assay instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Assay
				agent.post('/assays')
					.send(assay)
					.expect(200)
					.end(function(assaySaveErr, assaySaveRes) {
						// Handle Assay save error
						if (assaySaveErr) done(assaySaveErr);

						// Update Assay name
						assay.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Assay
						agent.put('/assays/' + assaySaveRes.body._id)
							.send(assay)
							.expect(200)
							.end(function(assayUpdateErr, assayUpdateRes) {
								// Handle Assay update error
								if (assayUpdateErr) done(assayUpdateErr);

								// Set assertions
								(assayUpdateRes.body._id).should.equal(assaySaveRes.body._id);
								(assayUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to get a list of Assays if not signed in', function(done) {
        // Create new Assay model instance
        var assayObj = new Assay(assay);

        // Save the Assay
        assayObj.save(function() {
            // Request Assays
            request(app).get('/assays/')
                .expect(401)
                .end(function(assayGetErr, assayGetRes) {
                    // Set message assertion
                    (assayGetRes.body.message).should.match('User is not logged in');

                    // Handle Assay error error
                    done(assayGetErr);
                });

        });
	});


	it('should not be able to get a single Assay if not signed in', function(done) {
		// Create new Assay model instance
		var assayObj = new Assay(assay);

		// Save the Assay
		assayObj.save(function() {
			request(app).get('/assays/' + assayObj._id)
                .expect(401)
				.end(function(req, res) {
					// Set assertion
                    (res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Assay instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Assay
				agent.post('/assays')
					.send(assay)
					.expect(200)
					.end(function(assaySaveErr, assaySaveRes) {
						// Handle Assay save error
						if (assaySaveErr) done(assaySaveErr);

						// Delete existing Assay
						agent.delete('/assays/' + assaySaveRes.body._id)
							.send(assay)
							.expect(200)
							.end(function(assayDeleteErr, assayDeleteRes) {
								// Handle Assay error error
								if (assayDeleteErr) done(assayDeleteErr);

								// Set assertions
								(assayDeleteRes.body._id).should.equal(assaySaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Assay instance if not signed in', function(done) {
		// Set Assay user 
		assay.user = user;

		// Create new Assay model instance
		var assayObj = new Assay(assay);

		// Save the Assay
		assayObj.save(function() {
			// Try deleting Assay
			request(app).delete('/assays/' + assayObj._id)
			.expect(401)
			.end(function(assayDeleteErr, assayDeleteRes) {
				// Set message assertion
				(assayDeleteRes.body.message).should.match('User is not logged in');

				// Handle Assay error error
				done(assayDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Assay.remove().exec();
		done();
	});
});
