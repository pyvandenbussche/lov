/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  , _ = require('underscore')

/**
 * User Schema
 */

var UserSchema = new Schema({
  name: { type: String, default: ''},
  email: { type: String, default: ''},
  category: { type: String, default: '' },
  callBackFn: { type: String, default: ''},
  apiKey: { type: String, default: '' },
  agent: {type : Schema.ObjectId, ref : 'Agent'},
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  activated: { type: Boolean, default: false }
})

/**
 * Virtuals
 */

UserSchema
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

// the below 4 validations only apply if you are signing up traditionally

UserSchema.path('name').validate(function (name) {
  return name.length
}, 'Name cannot be blank')

UserSchema.path('email').validate(function (email) {
  return email.length
}, 'Email cannot be blank')

UserSchema.path('email').validate(function (email, fn) {
  var User = mongoose.model('User')
  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({ email: email }).exec(function (err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, 'Email already exists')

UserSchema.path('hashed_password').validate(function (hashed_password) {
  return hashed_password.length
}, 'Password cannot be blank')


/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
  if (!this.isNew){
    
        console.log('2 '+this.agent);
         next();
  }

  if (!validatePresenceOf(this.password))
    next(new Error('Invalid password'))
  else
    next()
})

/**
 * Methods
 */

UserSchema.methods = {

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
    var encrypred
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
      return encrypred
    } catch (err) {
      return ''
    }
  }
}

UserSchema.statics = {
  
  listAdmin: function (cb) {
    this.find({category:"admin", activated:true}).exec(cb)
  },
}

mongoose.model('User', UserSchema)
