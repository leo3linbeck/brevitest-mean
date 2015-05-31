'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Prescription Schema
 */
var PrescriptionSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Prescription name',
		trim: true
	},
	comments: {
		type: String
	},
	prescribedOn: {
		type: Date
	},
	patientNumber: {
		type: String
	},
	patientGender: {
		type: String
	},
	patientDateOfBirth: {
		type: Date
	},
	filled: {
		type: Boolean,
		default: false
	},
	_assays: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Assay'
		}
	],
	_tests: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Test'
		}
	],
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Prescription', PrescriptionSchema);
