'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Address Schema
 */
var AddressSchema = new Schema({
	street1: {
		type: String,
		default: '',
		trim: true
	},
	street2: {
		type: String,
		default: '',
		trim: true
	},
	city: {
		type: String,
		default: '',
		trim: true
	},
	state: {
		type: String,
		default: '',
		trim: true
	},
	zipCode: {
		type: String,
		default: '',
		trim: true
	},
	uspsLine1: {
		type: String
	},
	uspsLine2: {
		type: String
	},
	latitude: {
		type: Number
	},
	longitude: {
		type: Number
	},
	createdOn: {
		type: Date,
		default: Date.now
	},
	_createdBy: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Address', AddressSchema);
