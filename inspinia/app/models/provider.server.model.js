'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Provider Schema
 */
var ProviderSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Provider name',
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
	_devices: {
		type: Schema.Types.ObjectId,
		ref: 'Device'
	},
	_cartridges: {
		type: Schema.Types.ObjectId,
		ref: 'Cartridge'
	},
	_users: {
		type: Schema.Types.ObjectId,
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

mongoose.model('Provider', ProviderSchema);
