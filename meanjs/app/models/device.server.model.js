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
		required: 'Please fill Device name',
		trim: true
	},
	serialNumber: {
		type: String,
		default: ''
	},
	status: {
		type: String
	},
	calibrationSteps: {
		type: Number
	},
	manufacturedOn: {
		type: Date
	},
	registeredOn: {
		type: Date
	},
	attached: {
		type: Boolean
	},
	particleID: {
		type: String
	},
	particleName: {
		type: String
	},
	lastHeard: {
		type: Date
	},
	lastIpAddress: {
		type: String
	},
	connected: {
		type: Boolean
	},
	claimed: {
		type: Boolean
	},
	_deviceModel: {
		type: Schema.ObjectId,
		ref: 'DeviceModel'
	},
	_devicePool: {
		type: Schema.ObjectId,
		ref: 'DevicePool'
	},
	_tests: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Test'
		}
	],
	_registeredBy: {
		type: Schema.ObjectId,
		ref: 'User'
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

mongoose.model('Device', DeviceSchema);
