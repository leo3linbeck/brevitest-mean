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
	uuid: {
		type: String,
		required: 'Please fill Spark ID'
	},
	lastHeard: {
		type: Date
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

mongoose.model('Spark', SparkSchema);
