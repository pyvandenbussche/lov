
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

var LogSuggestSchema = new Schema({
  suggestedBy: {type : String},
  uri: {type : String},
  date: {type: Date},
  status: {type : String} 
})


/**
 * Statics
 */

LogSuggestSchema.statics = {
  list: function (cb) {
    this.find()
      .sort({date:-1})
      .exec(cb)
  },
}

mongoose.model('LogSuggest', LogSuggestSchema)
