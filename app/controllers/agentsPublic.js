
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , AgentPublic = mongoose.model('AgentPublic')
  , Vocabulary = mongoose.model('Vocabulary')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  
  
/**
 * Create agent
 */
exports.createAgent = function (req, res) {
  var agent = new AgentPublic(req.body)
  
  //created on an existing agent
  if(agent.agentHidden.length){
  console.log(agent.agentHidden)
    AgentPublic.load(agent.agentHidden, function (err, existingAgent) {
      if (err) return next(err)    
      if (!existingAgent) return next(new Error('Agent '+id+' not found'))
      existingAgent = _.extend(existingAgent, req.body)
      existingAgent.save(function (err) {
        if (err) {
          return res.render('agents/editPublic', {
            errors: utils.errors(err),
            agent: agent
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
        return res.render('agents/editPublic', {
          errors: utils.errors(err.errors),
          agent: agent
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
  
  AgentPublic.load(id, function (err, agent) {
    if (err) return next(err)    
    if (!agent) return next(new Error('Agent '+id+' not found'))
    req.agent = agent
    next()
  })
}

/**
 * List
 */

exports.index = function(req, res){
  AgentPublic.listPersons( function(err, persons) {
    if (err) return res.render('500')
    AgentPublic.listOrganizations( function(err, organizations) {
      if (err) return res.render('500')
      var count = persons.length+organizations.length;
      res.render('agents/index', {
        count: count,
        persons: persons,
        organizations: organizations
      })
    })
  })  
}

/**
 * Edit an agent
 */

exports.edit = function (req, res) {
  res.render('agents/editPublic', {
    agent: req.agent
  })
}

/**
 * Update agent
 */

exports.update = function(req, res){
  var agent = req.agent
  agent = _.extend(agent, req.body)
  if(!req.body.altUris)agent.altUris=undefined; //trick to remove all elements when no altUris
  agent.save(function(err) {
    if (!err) {
      return res.redirect('/agents/' + agent._id)
    }
    res.render('agents/editPublic', {
      agent: agent,
      errors: err.errors
    })
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  Vocabulary.listAgent(req.agent._id, function(err, vocabs) {
    if (err) return res.render('500')
    res.render('agents/show', {
      agent: req.agent,
      vocabs: vocabs
    })
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

exports.autoComplete = function(req, res) {
   var regex = new RegExp(req.query["term"], 'i');
   var query = AgentPublic.find({$or: [{name: regex},{prefUri: regex}], 'type':'person', 'email':{$exists:false}},{name:1}).sort({name:1}).limit(10);
        
      // Execute query in a callback and return agents list
  query.exec(function(err, agents) {
      if (!err) {
         res.send(agents, {
            'Content-Type': 'application/json'
         }, 200);
      } else {
         res.send(JSON.stringify(err), {
            'Content-Type': 'application/json'
         }, 404);
      }
   });
}
