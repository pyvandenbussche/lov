
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
    user: req.userObj
  })
}

/**
 * Update user
 */

exports.update = function(req, res){
  var user = req.userObj  
  user.email = req.body.email
  if(req.body.password && req.body.password.length>0){
    user.password=req.body.password;
  }

  user.save(function(err) {
    if (!err) {
      req.flash('info', 'User updated successfully')
      return res.redirect('/edition/lov')
    }
    res.render('users/edit', {
      user: user,
      errors: err.errors
    })
  })
}

/*exports.reviewBatch = function(req, res){
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
}*/

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
  Agent.loadFromName(req.body.agentHidden, function (err, agentBinding) {
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

      res.redirect('/edition/lov/login')
      // manually login the user once successfully signed up
      /*req.logIn(user, function(err) {
        if (err) return next(err)
        return res.redirect('/edition/lov/')
      })*/
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

exports.load = function(req, res, next, id){
  User.load(id, function (err, user) {
    if (err) return next(err)    
    if (!user) return next(new Error('User '+id+' not found'))
    req.userObj = user
    next()
  })
}

/**
 * Delete a user
 */
exports.destroy = function(req, res){
  var user = req.userObj
  user.remove(function(err){
    req.flash('info', 'User deleted successfully')
    res.redirect('/edition/lov/users')
  })
}

/**
 * List
 */
exports.index = function(req, res){
  // TODO: add filters like page size, category, status and search feature

  User.list( function(err, users) {
    if (err) return res.render('500')
     res.render('users/index', {
      utils: utils,
      users: users
    })
  })
}

exports.userChangeCategory = function(req, res){
  User.update({_id:req.body.userId},{$set:{category:req.body.category}}).exec(function(err, user) {
      if (err) return res.render('500')
      res.redirect('/edition/lov/users');
  });  
}


/*exports.index = function(req, res){
console.log(req);
  Vocabulary.listVocabsForReview(function (err, vocabsForReview) {
    LogSuggest.list(function (err, suggests) {
      User.listUsersForReview(function (err, users) {
        res.render('users/index', {
          utils: utils,
          users:users,
          suggests:suggests,
          vocabsForReview:vocabsForReview,
          auth:req.user
        })
      })
    })
  })
 }*/

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
