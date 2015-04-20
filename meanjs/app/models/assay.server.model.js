'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

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
	createdOn: {
		type: Date,
		default: Date.now
	},
	_createdBy: {
		type: Schema.ObjectId,
		ref: 'User'
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
	BCODE: {
		type: String
	},
	analysis: {
		redMax: {type: Number},
		greenMax: {type: Number},
		greenMin: {type: Number},
		redMin: {type: Number}
	},
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
	}
});

mongoose.model('Assay', AssaySchema);
