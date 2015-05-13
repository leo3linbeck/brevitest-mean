'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Spark = mongoose.model('Spark'),
  _ = require('lodash'),
  sparkcore = require('spark'),
  Q = require('q');

/**
 * Refresh Spark data
 */

function getUpdatePromise(e) {
  return new Q(Spark.findOneAndUpdate({
    sparkID: e.sparkID
  }, e, {
    upsert: true
  }).exec());
}

exports.refresh = function(req, res) {
    console.log('Spark start refresh');

    Q.fcall(function(auth) {
        return new Q(sparkcore.login(auth));
        }, {
          username: 'leo3@linbeck.com',
          password: '2january88'
        })
      .then(function(token) {
        return new Q(sparkcore.listDevices());
      })
      .then(function(devices) {
        console.log('Update devices', devices);
        var promises = [];
        devices.forEach(function(e) {
          var s = {
            name: e.attributes.name,
            sparkID: e.attributes.id,
            lastHeard: e.attributes.lastHeard,
            lastIpAddress: e.attributes.lastIpAddress,
            connected: e.attributes.connected,
            user: req.user._id
          };
          promises.push(getUpdatePromise(s));
        });
        return Q.allSettled(promises);
      })
      .then(function() {
        return new Q(Spark.find().populate('user', 'displayName').exec());
      })
      .then(function(result) {
        res.send(result);
      })
      .fail(
        function(err) {
          console.log('Spark refresh failed', err);
        })
      .done();
    };

    /**
     * Create a Spark
     */
    exports.create = function(req, res) {
      var spark = new Spark(req.body);
      spark.user = req.user;

      spark.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.jsonp(spark);
        }
      });
    };

    /**
     * Show the current Spark
     */
    exports.read = function(req, res) {
      res.jsonp(req.spark);
    };

    /**
     * Update a Spark
     */
    exports.update = function(req, res) {
      var spark = req.spark;

      spark = _.extend(spark, req.body);

      spark.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.jsonp(spark);
        }
      });
    };

    /**
     * Delete an Spark
     */
    exports.delete = function(req, res) {
      var spark = req.spark;

      spark.remove(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.jsonp(spark);
        }
      });
    };

    /**
     * List of Sparks
     */
    exports.list = function(req, res) {
      console.log('Spark list');
      Spark.find().sort('-created').populate('user', 'displayName').exec(function(err, sparks) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.jsonp(sparks);
        }
      });
    };

    /**
     * Spark middleware
     */
    exports.sparkByID = function(req, res, next, id) {
      Spark.findById(id).populate('user', 'displayName').exec(function(err, spark) {
        if (err) return next(err);
        if (!spark) return next(new Error('Failed to load Spark ' + id));
        req.spark = spark;
        next();
      });
    };

    /**
     * Spark authorization middleware
     */
    exports.hasAuthorization = function(req, res, next) {
      if (req.spark.user.id !== req.user.id) {
        return res.status(403).send('User is not authorized');
      }
      next();
    };
