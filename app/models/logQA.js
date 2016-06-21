
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

var LogQA = new Schema({
  query: {type : String, trim : true},
  isQuestionProcessed: {type : Boolean},
  isResultEmpty: {type : Boolean},
  date: {type: Date}
})


/**
 * Statics
 */

LogQA.statics = {

  list: function (cb) {
    this.find({},{"_id":0}).sort({'date':1}).exec(cb)
  },
}

mongoose.model('LogQA', LogQA)
