/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  , _ = require('underscore')
  , async = require('async');

/**
 * User Schema
 */

var UserSchema = new Schema({
  email: { type: String},
  category: { type: String, default: 'curator' },
  agent: {type : Schema.ObjectId, ref : 'Agent'},
  hashed_password: { type: String},
  salt: { type: String },
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
UserSchema.path('email').validate(function (email) {
  return email.length
}, 'Email cannot be blank')

UserSchema.path('email').validate(function (email) {
  var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return emailRegex.test(email);
}, 'Email not valid')

UserSchema.path('email').validate(function (email, fn) {
  var User = mongoose.model('User')
  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({ email: email }).exec(function (err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, 'This email already exists')

UserSchema.path('hashed_password').validate(function (hashed_password) {
  return hashed_password.length
}, 'Password cannot be blank')


/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
  if (!this.isNew)next()
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
  
  listUsersForReview: function (cb) {
    this.find({activated:false}).populate('agent', 'name').exec(cb)
  },
  
  processUsersReviewBatch: function (deleteArray, activateArray, callback) {
    
    var _self = this;
    var calls = [];
    for (i = 0; i < deleteArray.length; i++) { 
      console.log("delete: "+deleteArray[i]);
      //calls.push(function(cb) { return _self.find({_id:mongoose.Types.ObjectId(deleteArray[i])}).remove().exec(cb)});
    }
    for (i = 0; i < activateArray.length; i++) { 
      console.log("activate: "+activateArray[i]);
      calls.push(function(cb) { return _self.update({_id:activateArray[i]}, {$set:{activated:true}}, function(err, result) {
        console.log(result);
        return callback(err);
      })});
    }
    console.log(calls);
    async.parallel(calls, callback);
    
    /*
    var performers;

performers = {};

async.parallel([
  function(callback) {
    return conductor.find({}, function(err, result) {
      performers.conductor = result;
      return callback(err);
    });
  }, function(callback) {
    return soloist.find({}, function(err, result) {
      performers.soloist = result;
      return callback(err);
    });
  }, function(callback) {
    return orchestra.find({}, function(err, result) {
      performers.orchestra = result;
      return callback(err);
    });
  }, function(callback) {
    return chamber.find({}, function(err, result) {
      performers.chamber = result;
      return callback(err);
    });
  }
], function(err) {
  return res.json(performers);
});
*/
    
  }
}

mongoose.model('User', UserSchema)
