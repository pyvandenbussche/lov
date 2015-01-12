/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema
  
/**
 * Agent Schema
 */
var AgentPublicSchema = new Schema({
  prefUri: {type : String, default : '', trim : true},
  name: {type : String, default : '', trim : true},
  altUris: {type: []},
  languages: {type: [{ type: Schema.ObjectId, ref: 'Language' }]},
  hasRoleInVocab: [{ type: Schema.ObjectId, ref: 'Vocabulary' }],
  'type': {type : String, default : 'person', trim : true},
  email: { type: String},
  category: { type: String, default : 'curator' },
  callBackFn: { type: String},
  apiKey: { type: String },
  hashed_password: { type: String},
  salt: { type: String},
  activated: { type: Boolean, default: false }
}, { collection: 'agents'})


/**
 * Validations
 */
AgentPublicSchema.path('prefUri').validate(function (prefUri) {
  return prefUri.length > 0
}, 'Agent preferred URI cannot be blank')

AgentPublicSchema.path('name').validate(function (name) {
  return name.length > 0
}, 'Agent Name cannot be blank')

AgentPublicSchema.path('type').validate(function (type) {
  return type.length > 0
}, 'Agent type cannot be blank')


/**
 * Statics
 */
AgentPublicSchema.statics = {
  /**
   * Find agent by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */
  load: function (id, cb) {
    this.findOne({_id : id})
      .populate('hasRoleInVocab','prefix')
      .populate('languages','label')
      .exec(cb)
  },
  
    /**
   * List agents of type person
   *
   * @param {Function} cb
   * @api private
   */

  listPersons: function (cb) {

    this.find({'type':'person'})
      .sort({'name': 1}) // sort by name
      .populate('hasRoleInVocab','prefix')
      .exec(cb)
  },
  
  /**
   * List agents of type organization
   *
   * @param {Function} cb
   * @api private
   */

  listOrganizations: function (cb) {

    this.find({'type':'organization'})
      .sort({'name': 1}) // sort by name
      .populate('hasRoleInVocab','prefix')
      .exec(cb)
  }

}

mongoose.model('AgentPublic', AgentPublicSchema)