'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Device model Schema
 */
var DeviceModelSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Device model name',
		trim: true
	},
	reference: {
		type: String,
		trim: true
	},
	description: {
		type: String
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

mongoose.model('DeviceModel', DeviceModelSchema);
