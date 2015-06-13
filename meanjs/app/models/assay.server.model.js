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

var BCODESchema = new Schema({
	command: {
		type: String,
		default: '',
		required: 'Please fill Command name',
		trim: true
	},
	params: {
		type: String,
		default: ''
	}
});

/**
 * Assay Schema
 */
var AssaySchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Assay name',
		trim: true
	},
	reference: {
		type: String
	},
	description: {
		type: String,
		trim: true
	},
	url: {
		type: String
	},
	usableLife: {
		type: Number
	},
	BCODE: [BCODESchema],
	analysis: {
		redMax: {type: Number},
		greenMax: {type: Number},
		greenMin: {type: Number},
		redMin: {type: Number}
	},
	standardCurve: [StandardCurvePointSchema],
	_manufacturer: {
		type: Schema.ObjectId,
		ref: 'Manufacturer'
	},
	_tests: {
		type: Schema.Types.ObjectId,
		ref: 'Test'
	},
	_cartridges: {
		type: Schema.Types.ObjectId,
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

mongoose.model('Assay', AssaySchema);
