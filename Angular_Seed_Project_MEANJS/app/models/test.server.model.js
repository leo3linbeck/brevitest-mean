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
	status: {
		type: String
	},
	percentComplete: {
		type: Number
	},
	description: {
		type: String,
		trim: true
	},
	url: {
		type: String
	},
	BCODE: {
		type: String
	},
	analysis: {
		redMax: {type: Number},
		greenMax: {type: Number},
		greenMin: {type: Number},
		redMin: {type: Number}
	},
	startedOn: {
		type: Date
	},
	finishedOn: {
		type: Date
	},
	_assay: {
		type: Schema.ObjectId,
		ref: 'Assay'
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
