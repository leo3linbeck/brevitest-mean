'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var StandardCurvePointSchema = new Schema({
	x: {
		type: Number
	},
	y: {
		type: Number
	}
});

/**
 * Test Schema
 */
var TestSchema = new Schema({
	reference: {
		type: String,
		default: '',
		required: 'Please fill Test reference',
		trim: true
	},
	subject: {
		type: String
	},
	description: {
		type: String
	},
	status: {
		type: String
	},
	percentComplete: {
		type: Number
	},
	analysis: {
		redMax: {type: Number},
		greenMax: {type: Number},
		greenMin: {type: Number},
		redMin: {type: Number}
	},
	standardCurve: [StandardCurvePointSchema],
	reading: {
		type: Number
	},
	result: {
		type: String
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
