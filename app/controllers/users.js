
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , users = require('./users')
  , Agent = mongoose.model('Agent')
  , Vocabulary = mongoose.model('Vocabulary')
  , LogSuggest = mongoose.model('LogSuggest')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  , async = require('async')
  , ObjectId = mongoose.Types.ObjectId

var login = function (req, res) {
  if (req.session.returnTo) {
    res.redirect(req.session.returnTo)
    delete req.session.returnTo
    return
  }
  res.redirect('/')
}

exports.signin = function (req, res) {}

/**
 * Auth callback
 */

exports.authCallback = login

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login',
    message: req.flash('error')
  })
}

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  })
}

/**
 * Edit a user
 */

exports.edit = function (req, res) {
  res.render('users/edit', {
    user: req.user
  })
}

/**
 * Update user
 */

exports.update = function(req, res){
  var user = req.user
  user = _.extend(user, req.body)

  user.save(function(err) {
    if (!err) {
      return res.redirect('edition/lov/users/' + user._id)
    }
    console.log(err.errors)
    res.render('users/edit', {
      user: user,
      errors: err.errors
    })
  })
}

exports.reviewBatch = function(req, res){
  var deleteArray=JSON.parse(req.body.deleteArray);
  var activateArray=JSON.parse(req.body.activateArray);
  
  async.each(activateArray, function(id, callback) {
      User.update({_id:id},{$set:{activated:true}}).exec(callback);
  }, function(err, result) {
      if( err ) { return console.log(err); }
      async.each(deleteArray, function(id, cb) {
          User.find({_id:id}).remove().exec(cb);
      }, function(err, result) {
          if( err ) { return console.log(err); }
          res.redirect('/edition/lov/');
      });
  });
}

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout()
  res.redirect('/edition/lov/login')
}

/**
 * Session
 */

exports.session = login

/**
 * Create user
 */

exports.create = function (req, res) {
  Agent.load(req.body.agentHidden, function (err, agentBinding) {
    if (err) return err 
    if (!agentBinding) return new Error('Agent '+agentHidden+' not found')
    req.body.agent = agentBinding;
    
    var user = new User(req.body)
    console.log(JSON.stringify(user));
    user.provider = 'local'
    user.save(function (err) {
      if (err) {
        return res.render('users/signup', {
          errors: utils.errors(err.errors),
          user: user,
          title: 'Sign up'
        })
      }

      // manually login the user once successfully signed up
      req.logIn(user, function(err) {
        if (err) return next(err)
        return res.redirect('/edition/lov/')
      })
    })
  })
}

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var user = req.profile
  res.render('users/show', {
    title: user.name,
    user: user
  })
}

exports.index = function(req, res){
  LogSuggest.list(function (err, suggests) {
    User.listUsersForReview(function (err, users) {
      res.render('users/index', {
        utils: utils,
        users:users,
        suggests:suggests
      })
    })
  })
 }

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
  User
    .findOne({ _id : id })
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      next()
    })
}
