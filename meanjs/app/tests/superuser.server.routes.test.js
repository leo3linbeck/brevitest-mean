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
var credentials, user;

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
			firstName: 'Billy Bob Joe',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local',
            roles: ['user', 'admin', 'superuser']
		});

        user.save(function() {
            done();
        });
	});

	it('should be able to get a list of users if signed in as a superuser', function (done) {

        agent.post('/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function (signinErr, signinRes) {
                // Handle signin error
                if (signinErr)
                    done(signinErr);

                agent.get('/users/' + user._id)
                    .expect(200)
                    .end(function (err, res) {
                        if (err)
                            done(err);

                        res.body.should.be.an.Object.with.property('firstName', user.firstName);
                        done();

                    });

            });
    });

	afterEach(function(done) {
		User.remove().exec();
		done();
	});
});
