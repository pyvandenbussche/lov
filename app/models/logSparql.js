
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema


/**
 * Article Schema
 */

var LogSparql = new Schema({
  query: {type : String, trim : true},
  execTime: {type : String},
  date: {type: Date},
  nbResults: {type : String}
})


/**
 * Statics
 */

LogSparql.statics = {

  list: function (cb) {
    this.find({},{"_id":0}).sort({'date':1}).exec(cb)
  },
}

mongoose.model('LogSparql', LogSparql)
