
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema


/**
 * Statlanguage Schema
 */

var StatlanguageSchema = new Schema({
  label: {type : String, default : '', trim : true},
  nbOccurrences: {type: Number}
  
})


/**
 * Statics
 */

StatlanguageSchema.statics = {

  
  mostPopularLangs: function (cb) {
    this.find({},{"_id":0}).sort({'nbOccurrences':-1}).exec(cb)
  },
}

mongoose.model('Statlanguage', StatlanguageSchema)
