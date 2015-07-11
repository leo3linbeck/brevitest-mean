'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Firmware test Schema
 */
var FirmwareTestSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Firmware test name',
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

mongoose.model('FirmwareTest', FirmwareTestSchema);