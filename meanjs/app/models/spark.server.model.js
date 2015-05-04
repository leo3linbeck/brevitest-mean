'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Spark Schema
 */
var SparkSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Spark name',
		trim: true
	},
	sparkID: {
		type: String,
		minlength: 32,
		maxlength: 32,
		required: 'Please fill Spark ID',
		trim: true
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
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Spark', SparkSchema);
