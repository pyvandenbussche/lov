
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , _ = require('underscore')

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

exports.new = function (req, res) {
  res.render('users/new', {
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
      return res.redirect('/users/' + user._id)
    }
    console.log(err.errors)
    res.render('users/edit', {
      user: user,
      errors: err.errors
    })
  })
}

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout()
  res.redirect('/login')
}

/**
 * Session
 */

exports.session = login

/**
 * Create user
 */

exports.create = function (req, res) {
  var user = new User(req.body)
  user.provider = 'local'
  user.save(function (err) {
    if (err) {
      return res.render('users/new', {
        errors: utils.errors(err.errors),
        user: user,
        title: 'Sign up'
      })
    }

    // manually login the user once successfully signed up
    req.logIn(user, function(err) {
      if (err) return next(err)
      return res.redirect('/')
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
