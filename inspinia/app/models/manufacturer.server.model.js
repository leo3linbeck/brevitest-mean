'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Manufacturer Schema
 */
var ManufacturerSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Manufacturer name',
		trim: true
	},
	mainContact: {
		type: String,
		trim: true
	},
	_mainAddress: {
		type: Schema.ObjectId,
		ref: 'Address'
	},
	_assays: {
		type: Schema.Types.ObjectId,
		ref: 'Assay'
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

mongoose.model('Manufacturer', ManufacturerSchema);
