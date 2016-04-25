
/*!
 * nodejs-express-mongoose-demo
 * Copyright(c) 2013 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , https = require('https')
  , http = require('http')
  , keys_dir = '/etc/letsencrypt/live/lov.okfn.org/'
  , server_options = {
        key  : fs.readFileSync(keys_dir + 'privkey.pem'),
        cert : fs.readFileSync(keys_dir + 'cert.pem')
      }
  , passport = require('passport')
  , mongoose = require('mongoose')
  , nodemailer = require('nodemailer')
  , ElasticSearchClient = require('elasticsearchclient')
  , elasticsearch = require('elasticsearch')

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// if test env, load example file
var env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
    
// set default timezon in London
process.env.TZ = 'Europe/London';

// Bootstrap db connection
mongoose.connect(config.db)

// Bootstrap ElasticSearch Connection
var esclient = new ElasticSearchClient(config.es);
console.log({host:config.es.host+':'+config.es.port});
var elasticsearchclient = new elasticsearch.Client({host:config.es.host+':'+config.es.port});

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

// bootstrap passport config
require('./config/passport')(passport, config)

var app = express()
// express settings
require('./config/express')(app, config, passport)

//bottstrap transporter for nodemailer
var transporter = nodemailer.createTransport("SMTP", config.email);

// Bootstrap routes
require('./config/routes')(app, passport, esclient, elasticsearchclient, transporter)

// Start the app by listening on <port>
var port = process.env.PORT || 3333
https.createServer(server_options,app).listen(4444);
http.createServer(app).listen(port);

//app.listen(port)
console.log('Express app started on port '+port)

// expose app
exports = module.exports = app
