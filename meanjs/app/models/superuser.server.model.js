'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Superuser Schema
 */
var SuperuserSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Superuser name',
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

mongoose.model('Superuser', SuperuserSchema);