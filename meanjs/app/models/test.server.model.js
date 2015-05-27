'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Test Schema
 */
var TestSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Test name',
		trim: true
	},
	description: {
		type: String,
		trim: true
	},
	status: {
		type: String
	},
	percentComplete: {
		type: Number
	},
	reading: {
		type: Number
	},
	result: {
		type: String
	},
	_prescription: {
		type: Schema.ObjectId,
		ref: 'Prescription'
	},
	_assay: {
		type: Schema.ObjectId,
		ref: 'Assay'
	},
	_device: {
		type: Schema.ObjectId,
		ref: 'Device'
	},
	_cartridge: {
		type: Schema.ObjectId,
		ref: 'Cartridge'
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

mongoose.model('Test', TestSchema);
