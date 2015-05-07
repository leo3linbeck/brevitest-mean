'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var AddressSchema = new Schema({
	location: {
		type: String
	},
	street1: {
		type: String
	},
	street2: {
		type: String
	},
	city: {
		type: String
	},
	state: {
		type: String
	},
	zipcode: {
		type: String
	}
});

/**
 * Healthcare provider Schema
 */
var HealthcareProviderSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Healthcare provider name',
		trim: true
	},
	addresses: [AddressSchema],
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('HealthcareProvider', HealthcareProviderSchema);
