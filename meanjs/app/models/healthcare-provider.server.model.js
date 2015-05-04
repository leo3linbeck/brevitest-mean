'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

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