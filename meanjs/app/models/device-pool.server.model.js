'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Device pool Schema
 */
var DevicePoolSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Device pool name',
		trim: true
	},
	description: {
		type: String
	},
	_organization: {
		type: Schema.ObjectId,
		ref: 'Organization'
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

mongoose.model('DevicePool', DevicePoolSchema);
