
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

var LogSearchSchema = new Schema({
  searchWords: {type : String, trim : true},
  searchURL: {type : String},
  date: {type: Date},
  category: {type : String},
  method: {type : String},
  nbResults: {type : String}  
})


/**
 * Statics
 */

LogSearchSchema.statics = {

  
  mostPopularTags: function (nbItemsRequired, cb) {
    this.find({},{"_id":0}).sort({'nbOccurrences':-1}).limit(nbItemsRequired).exec(cb)
  },
}

mongoose.model('LogSearch', LogSearchSchema)
