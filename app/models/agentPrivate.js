
/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , crypto = require('crypto')
  , Schema = mongoose.Schema

  
  
/**
 * Agent Schema
 */
var AgentPrivateSchema = new Schema({
  prefUri: {type : String, default : '', trim : true},
  name: {type : String, default : '', trim : true},
  altUris: {type: []},
  languages: {type: [{ type: Schema.ObjectId, ref: 'Language' }]},
  hasRoleInVocab: [{ type: Schema.ObjectId, ref: 'Vocabulary' }],
  'type': {type : String, default : 'person', trim : true},
  email: { type: String},
  category: { type: String, default : 'person' },
  callBackFn: { type: String},
  apiKey: { type: String },
  hashed_password: { type: String},
  salt: { type: String, default: '' },
  activated: { type: Boolean, default: false }
}, { collection: 'agents'})

/**
 * Virtuals
 */ 
AgentPrivateSchema
  .virtual('agentHidden')
  .set(function(agentHidden) {
    this._agentHidden = agentHidden
  })
  .get(function() { return this._agentHidden })

AgentPrivateSchema
  .virtual('password')
  .set(function(password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() { return this._password })
  


/**
 * Validations
 */
 
var validatePresenceOf = function (value) {
  return value && value.length
}

AgentPrivateSchema.path('name').validate(function (name) {
  return name.length > 0
}, 'Agent Name cannot be blank')

AgentPrivateSchema.path('email').validate(function (email) {
  return email.length > 0
}, 'Email cannot be blank')

AgentPrivateSchema.path('email').validate(function (email) {
  var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return emailRegex.test(email);
}, 'Email not valid')

AgentPrivateSchema.path('email').validate(function (email, fn) {
  var Agent = mongoose.model('AgentPrivate')
  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    Agent.find({ email: email }).exec(function (err, agents) {
      fn(!err && agents.length === 0)
    })
  } else fn(true)
}, 'Email already exists')

AgentPrivateSchema.path('hashed_password').validate(function (hashed_password) {
  return hashed_password.length
}, 'Password cannot be blank')


/**
 * Pre-save hook
 */

AgentPrivateSchema.pre('save', function(next) {
  if (!this.isNew)next()
  if (!validatePresenceOf(this.password))
    next(new Error('Invalid password'))
  else
    next()
})

/**
 * Methods
 */ 
AgentPrivateSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password
  },
  
  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function () {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function (password) {
    if (!password) return ''
    var encrypted
    try {
      encrypted = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
      return encrypted
    } catch (err) {
      return ''
    }
  }

}
/**
 * Statics
 */
AgentPrivateSchema.statics = {

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

}

mongoose.model('AgentPrivate', AgentPrivateSchema)
