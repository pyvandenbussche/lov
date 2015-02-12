
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

var StattagSchema = new Schema({
  label: {type : String, default : '', trim : true},
  nbOccurrences: {type: Number}
  
})


/**
 * Statics
 */

StattagSchema.statics = {

  list: function (cb) {
    this.find({},{"_id":0}).sort({'label':1}).exec(cb)
  },
  mostPopularTags: function (nbItemsRequired, cb) {
    this.find({},{"_id":0}).sort({'nbOccurrences':-1}).limit(nbItemsRequired).exec(cb)
  }
}

mongoose.model('Stattag', StattagSchema)
