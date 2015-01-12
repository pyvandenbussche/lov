
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

var StatvocabularySchema = new Schema({
  uri: {type : String, default : '', trim : true},
  nsp: {type : String, default : '', trim : true},
  prefix: {type : String, default : '', trim : true},
 
  nbIncomingLinks: {type: Number},
  incomRelMetadata: [{ type : String, ref : 'Statvocabulary'}],
  incomRelSpecializes: [{ type : String, ref : 'Statvocabulary'}],
  incomRelGeneralizes: [{ type : String, ref : 'Statvocabulary'}],
  incomRelExtends: [{ type : String, ref : 'Statvocabulary'}],
  incomRelEquivalent: [{ type : String, ref : 'Statvocabulary'}],
  incomRelDisjunc: [{ type : String, ref : 'Statvocabulary'}],
  incomRelImports: [{ type : String, ref : 'Statvocabulary'}],
  
  outRelMetadata: [{ type : String, ref : 'Statvocabulary'}],
  outRelSpecializes: [{ type : String, ref : 'Statvocabulary'}],
  outRelGeneralizes: [{ type : String, ref : 'Statvocabulary'}],
  outRelExtends: [{ type : String, ref : 'Statvocabulary'}],
  outRelEquivalent: [{ type : String, ref : 'Statvocabulary'}],
  outRelDisjunc: [{ type : String, ref : 'Statvocabulary'}],
  outRelImports: [{ type : String, ref : 'Statvocabulary'}]
  
})


/**
 * Statics
 */

StatvocabularySchema.statics = {

  listPrefixNspUri: function (cb) {
    this.find({},{nbIncomingLinks:1,prefix:1, nsp:1, uri:1,_id:0}).sort({'prefix': 1}).exec(cb)
  },
  
  load: function (vocabUri, cb) {
    this.findOne({ uri: vocabUri },{'_id':0})
    .populate('incomRelMetadata', 'prefix nbIncomingLinks')
    .populate('incomRelSpecializes', 'prefix nbIncomingLinks')
    .populate('incomRelGeneralizes', 'prefix nbIncomingLinks')
    .populate('incomRelExtends', 'prefix nbIncomingLinks')
    .populate('incomRelEquivalent', 'prefix nbIncomingLinks')
    .populate('incomRelDisjunc', 'prefix nbIncomingLinks')
    .populate('incomRelImports', 'prefix nbIncomingLinks')
    .populate('outRelMetadata', 'prefix nbIncomingLinks')
    .populate('outRelSpecializes', 'prefix nbIncomingLinks')
    .populate('outRelGeneralizes', 'prefix nbIncomingLinks')
    .populate('outRelExtends', 'prefix nbIncomingLinks')
    .populate('outRelEquivalent', 'prefix nbIncomingLinks')
    .populate('outRelDisjunc', 'prefix nbIncomingLinks')
    .populate('outRelImports', 'prefix nbIncomingLinks')
    .exec(cb)
  },
  
  mostLOVIncomingLinks: function (nbItemsRequired, cb) {
    this.find({ prefix: { $nin: [ 'rdf','rdfs','owl','xsd' ] } },{'_id':0,'nbIncomingLinks':1, 'prefix':1}).sort({'nbIncomingLinks':-1}).limit(nbItemsRequired).exec(cb)
  },
}

mongoose.model('Statvocabulary', StatvocabularySchema)
