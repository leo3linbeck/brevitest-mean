'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Device Schema
 */
var DeviceSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill in Device name',
		trim: true
	},
	serialNumber: {
		type: String,
		default: ''
	},
	online: {
		type: Boolean,
		default: false
	},
	calibrationSteps: {
		type: Number
	},
	status: {
		type: String
	},
	manufacturedOn: {
		type: Date
	},
	registeredOn: {
		type: Date
	},
	_spark: {
		type: Schema.ObjectId,
		ref: 'Spark'
	},
	_deviceModel: {
		type: Schema.ObjectId,
		ref: 'DeviceModel'
	},
	_tests: {
		type: Schema.Types.ObjectId,
		ref: 'Test'
	},
	_registeredBy: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	createdOn: {
		type: Date,
		default: Date.now
	},
	_createdBy: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Device', DeviceSchema);
