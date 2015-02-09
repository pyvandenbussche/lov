
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , AgentPrivate = mongoose.model('AgentPrivate')
  , Vocabulary = mongoose.model('Vocabulary')
  , Language = mongoose.model('Language')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  
  
var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/'
  delete req.session.returnTo
  res.redirect(redirectTo)
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
  res.render('agents/login', {
    title: 'Login',
    message: req.flash('error')
  })
}

/**
 * Show sign up form
 */
exports.signup = function (req, res) {
  Language.listAll(function(err, langs) {
    if (err) return res.render('500')
    res.render('agents/signup', {
      title: 'Sign up',
      agent: new AgentPrivate(),
      langs:langs
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
 * Create agent
 */
exports.createAgent = function (req, res) {
  var agent = new AgentPrivate(req.body)
  console.log(agent);
  //created on an existing agent
  if(agent.agentHidden.length){
    AgentPrivate.load(agent.agentHidden, function (err, existingAgent) {
      if (err) return next(err)    
      if (!existingAgent) return next(new Error('Agent '+id+' not found'))
      existingAgent = _.extend(existingAgent, req.body)
      console.log(existingAgent);
      existingAgent.save(function (err) {
        if (err) {
          return res.render('agents/signup', {
            errors: err.errors,
            agent: agent,
            title: 'Sign up'
          })
        }
        // manually login the agent once successfully signed up
        req.logIn(existingAgent, function(err) {
          if (err) return next(err)
          return res.redirect('/')
        })
      })
    });
  }
  else{
    agent.save(function (err) {
      if (err) {
        return res.render('agents/signup', {
          errors: utils.errors(err.errors),
          agent: agent,
          title: 'Sign up'
        })
      }
      // manually login the agent once successfully signed up
      req.logIn(agent, function(err) {
        if (err) return next(err)
        return res.redirect('/')
      })
    })
  }
}

/**
 * Load
 */

exports.load = function(req, res, next, id){
  
  AgentPrivate.load(id, function (err, agent) {
    if (err) return next(err)    
    if (!agent) return next(new Error('Agent '+id+' not found'))
    req.agent = agent
    next()
  })
}

/**
 * Edit an agent
 */
exports.edit = function (req, res) {
  Language.listAll(function(err, langs) {
    if (err) return res.render('500')
    res.render('agents/editPrivate', {
      agent: req.agent,
      langs:langs
    })
  })
}

/**
 * Update agent
 */

exports.update = function(req, res){
  //var agent = req.agent
  AgentPrivate.load(req.agent._id, function (err, agent) {
      if (err){
        res.render('agents/editPrivate', {
          agent: agent,
          errors: err.errors
        })
      }
      agent = _.extend(agent, req.body)
      if(!req.body.languages)agent.languages=undefined; //trick to remove all elements when no languages
      console.log(req.body);
      agent.save(function(err) {
        if (!err) {
          return res.redirect('/agents/' + agent._id)
        }
        res.render('agents/editPrivate', {
          agent: agent,
          errors: err.errors
        })
      })
  });
}

/**
 * Show
 */
exports.show = function(req, res){
    res.render('agents/show', {
      agent: req.agent,
      vocabs: vocabs
    })  
}

/**
 * Delete an agent
 */
exports.destroy = function(req, res){
  var agent = req.agent
  agent.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/agents')
  })
}