'use strict';

module.exports = {
	db: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/brevitest',
	facebook: {
		clientID: process.env.FACEBOOK_ID || 'APP_ID',
		clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
		callbackURL: '/auth/facebook/callback'
	},
	twitter: {
		clientID: process.env.TWITTER_KEY || 'HBnRiLhHgCd0Qlv4sPj8y9a3c',
		clientSecret: process.env.TWITTER_SECRET || 'pNyFqnJ9RlF4fx9qtNYPZF6K4rkY8TaBMBcEYsWpSgBjmcmM9j',
		callbackURL: '/auth/twitter/callback'
	},
	google: {
		clientID: process.env.GOOGLE_ID || 'APP_ID',
		clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
		callbackURL: '/auth/google/callback'
	},
	linkedin: {
		clientID: process.env.LINKEDIN_ID || 'APP_ID',
		clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
		callbackURL: '/auth/linkedin/callback'
	},
	github: {
		clientID: process.env.GITHUB_ID || '42d3cb4bbdd5f00a47fc',
		clientSecret: process.env.GITHUB_SECRET || 'ca020ce1d553df65f0f7c6aa55b1ca8b10138660',
		callbackURL: '/auth/github/callback'
	},
	mailer: {
		from: process.env.MAILER_FROM || 'brevitest.development@gmail.com',
		options: {
			service: process.env.MAILER_SERVICE_PROVIDER || 'gmail.com',
			auth: {
				user: process.env.MAILER_EMAIL_ID || 'brevitest.development',
				pass: process.env.MAILER_PASSWORD || '2january88'
			}
		}
	}
};
