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
