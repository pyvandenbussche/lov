
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema

/**
 * Getters
 */

var getTags = function (tags) {
  return tags.join(',')
}
var getCreatorIds = function (altUris) {
  return altUris.join(',')
}

/**
 * Setters
 */

var setTags = function (tags) {
  return tags.split(',')
}

/**
 * Article Schema
 */

var VocabularySchema = new Schema({
  uri: {type : String, default : '', trim : true},
  nsp: {type : String, default : '', trim : true},
  prefix: {type : String, default : '', trim : true},
  titles: [{
    value: {type : String, default : '', trim : true},
    lang: {type : String, default : '', trim : true},
  }],
  descriptions: [{
    value: {type : String, default : '', trim : true},
    lang: {type : String, default : '', trim : true},
  }],
  tags: [{ type : String}],
  issuedAt  : {type : Date}, //first publication of the vocabulary on the WEB (not in LOV)
  createdInLOVAt  : {type : Date}, //creation of the record in LOV
  lastModifiedInLOVAt  : {type : Date}, //last modification of the record in LOV (either by the BOT or a curator)
  lastDeref  : {type : Date}, //Last date of successful dereferentiation by the BOT
	commentDeref: {type : String}, //if !=null means there has been an error during the dereferentiation
  
  homepage: {type : String, default : '', trim : true},
  isDefinedBy: {type : String, default : '', trim : true},
  creatorIds: [{ type : String, ref : 'Agent' }],
  contributorIds: [{ type : String, ref : 'Agent' }],
  publisherIds: [{ type : String, ref : 'Agent' }],
  reviews: [{
    body: { type : String, default : '' },
    agentId: { type : String, ref : 'Agent' },
    createdAt: { type : Date}
  }],
  comments: [{
    body: { type : String, default : '' },
    agentId: { type : String, ref : 'Agent' },
    createdAt: { type : Date}
  }],
  versions: [{
    name: { type : String, default : '' },
    fileURL: { type : String, default : '' },
    issued: { type : Date},
    classNumber: { type : String, default : '' },
    propertyNumber: { type : String, default : '' },
    instanceNumber: { type : String, default : '' },
    datatypeNumber: { type : String, default : '' },
    languageIds: [{ type : String, ref : 'Language' }],
    relMetadata: [{ type : String}],
    relDisjunc: [{ type : String}],
    relEquivalent: [{ type : String}],
    relExtends: [{ type : String}],
    relGeneralizes: [{ type : String}],
    relImports: [{ type : String}],
    relSpecializes: [{ type : String}]
  }],
  datasets: [{
    uri: { type : String, default : '' },
    label: { type : String, ref : 'Agent' },
    occurrences: { type : String}
  }],
  
  /*
  * properties from statistics
  */
  nbIncomingLinks: {type: Number},
  incomRelMetadata: [{ type : String}],
  incomRelSpecializes: [{ type : String}],
  incomRelGeneralizes: [{ type : String}],
  incomRelExtends: [{ type : String}],
  incomRelEquivalent: [{ type : String}],
  incomRelDisjunc: [{ type : String}],
  incomRelImports: [{ type : String}]
  
})

/**
 * Validations
 */


/**
 * Pre-remove hook
 */


/**
 * Methods
 */


/**
 * Statics
 */

VocabularySchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (prefix, cb) {
    this.findOne({ prefix : prefix })
      .populate('creatorIds', 'name')
      .populate('contributorIds', 'name')
      .populate('publisherIds', 'name')
      .populate('reviews.agentId', 'name')
      .populate('versions.languageIds', 'label iso639P3PCode')
      .exec(cb)
  },
  
  loadFromPrefixURINSP: function (prefixURINSP, cb) {
    this.findOne({ $or: [ //search for nsp or uri or prefix
   {prefix:prefixURINSP}, {uri:prefixURINSP},{nsp:prefixURINSP}]},{_id:0})
      .populate('creatorIds', 'name')
      .populate('contributorIds', 'name')
      .populate('publisherIds', 'name')
      .populate('reviews.agentId', 'name')
      .populate('versions.languageIds', 'label iso639P3PCode')
      .exec(cb)
  },

  findNspURI: function (uri, cb) {
    var canonicalURI = (uri.slice(-1) == '#' || uri.slice(-1) == '/') ? uri.slice(0,-1): uri; //remove trailing char (to match case where there is an extra '/' or '#')
    var termHash = canonicalURI+ "#";
    var termSlash = canonicalURI+ "/";
    //console.log(canonicalURI+' , '+termHash + ' , '+termSlash);
   this.findOne({ $or: [ //search for nsp or uri having either the canonical, the slashed or hashed form.
   {nsp:canonicalURI}, {uri:canonicalURI},
   {nsp:termHash}, {uri:termHash},
   {nsp:termSlash}, {uri:termSlash}
   ]})
      .exec(cb)
  },
  
  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (cb) {
    this.find({},{prefix:1, titles:1,_id:0}).sort({'prefix': 1}).exec(cb)
  },
  
  listPrefixNspUri: function (cb) {
    this.find({},{prefix:1, nsp:1, uri:1,_id:0}).sort({'prefix': 1}).exec(cb)
  },
  
  listPrefixNspUriTitles: function (cb) {
    this.find({},{prefix:1, nsp:1, uri:1, titles:1, _id:0}).sort({'prefix': 1}).exec(cb)
  },
  
  
  latestInsertion: function (nbItemsRequired, cb) {
    this.find({},{prefix:1, createdInLOVAt:1, titles:1,_id:0}).sort({'createdInLOVAt': -1}).limit(nbItemsRequired).exec(cb)
  },
  
  latestModification: function (nbItemsRequired, cb) {
    this.find({},{prefix:1, lastModifiedInLOVAt:1, titles:1,_id:0}).sort({'lastModifiedInLOVAt': -1}).limit(nbItemsRequired).exec(cb)
  },
  
  
  filterListVocab: function (sortParam,tagFilter,cb) {
    var sortParamsEnabled=["prefix"];
    if(!sortParam || sortParamsEnabled.indexOf(sortParam)<0)sortParam="prefix";
    this.find((!tagFilter)?{}:{tags:tagFilter},{ prefix:1, uri:1, nsp:1, titles:1, descriptions:1, tags:1, _id:0}).sort({prefix:1}).exec(cb)
  },
  
  
  listCreatedPerAgent: function (agentId, cb) {
    this.find({creatorIds:agentId},{prefix:1,_id:0,tags:1})
      .sort({prefix:1})
      .exec(cb)
  },
  
  listContributedPerAgent: function (agentId, cb) {
    this.find({contributorIds:agentId},{prefix:1,_id:0,tags:1})
      .sort({prefix:1})
      .exec(cb)
  },
  
  listPublishedPerAgent: function (agentId, cb) {
    this.find({publisherIds:agentId},{prefix:1,_id:0,tags:1})
      .sort({prefix:1})
      .exec(cb)
  },
  
  listVocabsForReview: function (agentId, cb) {
    this.find({publisherIds:agentId},{prefix:1,_id:0,tags:1})
      .sort({prefix:1})
      .exec(cb)
  },
  
  
  /**
   * List vocabularyprefix with all agents
   *
   * @param {Function} cb
   * @api private
   */

  listAgents: function (cb) {
    this.find({},{prefix:1,creatorIds:1,contributorIds:1,publisherIds:1})
      .sort({prefix:1})
      .exec(cb)
  },
  
  /**
   * List vocabularyprefix with all agents
   *
   * @param {Function} cb
   * @api private
   */
  listAgent: function (agentId, cb) {
    this.find({ $or: [ { creatorIds: agentId }, { contributorIds: agentId  }, { publisherIds: agentId  } ] },{prefix:1})
      .sort({prefix:1})
      .exec(cb)
  }

}

mongoose.model('Vocabulary', VocabularySchema)
