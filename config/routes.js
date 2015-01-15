/*!
 * Module dependencies.
 */

var async = require('async');

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , vocabularies = require('../app/controllers/vocabularies')
  , languages = require('../app/controllers/languages')
  , agents = require('../app/controllers/agents')
  , agentsPublic = require('../app/controllers/agentsPublic')
  , agentsPrivate = require('../app/controllers/agentsPrivate')
  , auth = require('./middlewares/authorization')
  , search = require('../app/controllers/search')
  , searchMulti = require('../app/controllers/searchMulti')
  , bot = require('../app/controllers/bot')
  , negotiate = require('express-negotiate')
  , queryExamples = require('../lib/queryExamples')
  

/**
 * Route middlewares
 */

//var articleAuth = [auth.requiresLogin, auth.article.hasAuthorization]
var agentAuth = [auth.requiresLogin, auth.agent.hasAuthorization]
var userAuth = [auth.requiresLogin, auth.user.hasAuthorization]


/**
 * Expose routes
 */

module.exports = function (app, passport,esclient, elasticsearchClient, emailTransporter) {

  // user routes
  //app.param('userId', users.user)
  //app.get('/login', agentsPrivate.login)
  //app.get('/signup', users.new)
  //app.get('/logout', agentsPrivate.logout)
  //app.post('/agents', agentsPrivate.createAgent)
  //app.post('/agents/session',
  //  passport.authenticate('local', {
  //   failureRedirect: '/login',
  //    failureFlash: 'Invalid email or password.'
  //  }), agentsPrivate.session)
  //app.get('/users/:userId', users.show)
  //app.get('/users/:userId/edit', userAuth, users.edit) //TODO breach security
  //app.put('/users/:userId', userAuth, users.update)//TODO breach security
 
  
  // agent / user routes
  
  app.get('/dataset/lov/agents', function(req, res){search.searchAgent(req,res,esclient);})
  //app.get('/agents/autocomplete', agentsPublic.autoComplete)
  app.get('/dataset/lov/agents/:agentId', agents.show)
  app.param('agentId', agents.load)
  //app.put('/agents/:agentId', agentAuth, agentsPublic.update)
  //app.get('/agents/new', auth.requiresLogin, agentsPublic.new)
  //app.get('/signup', agentsPrivate.signup)
  
  //app.post('/agents/private', agentsPrivate.createAgent)
  //app.get('/agents/private/:agentId/edit', agentAuth, agentsPrivate.edit)
  //app.get('/agents/:agentId/edit', agentAuth, agentsPublic.edit)
  //app.put('/agents/private/:agentId', agentAuth, agentsPrivate.update)
  //app.del('/agents/:agentId', agentAuth, agentsPublic.destroy)
  
  
  // vocabs routes

  app.get('/', function(req, res){res.redirect('/dataset/lov/')})
  app.get('/dataset', function(req, res){res.redirect('/dataset/lov/')})
  app.get('/dataset/lov', vocabularies.index)
  app.get('/dataset/lov/vocabs', function(req, res){search.searchVocabulary(req,res,esclient);})
  app.get('/dataset/lov/vocabs/:vocabId/versions/:vocabId-:date.n3', function(req, res) {
    console.log(req.vocab._id);
    console.log(req.params.vocabId);
    console.log(req.params.date);
    console.log(require('path').resolve(__dirname+'/../versions/'+req.vocab._id+'/'+req.vocab._id+'_'+req.params.date+'.n3'));
    res.download(require('path').resolve(__dirname+'/../versions/'+req.vocab._id+'/'+req.vocab._id+'_'+req.params.date+'.n3'),req.params.vocabId+'-'+req.params.date+'.n3');
});
  app.get('/dataset/lov/vocabs/:vocabId', vocabularies.show)
  //app.get('/vocabs/new', auth.requiresLogin, vocabularies.new)
  //app.post('/vocabs', auth.requiresLogin, vocabularies.create)
  //app.get('/vocabs/:vocabId/edit', articleAuth, vocabularies.edit)
  //app.put('/vocabs/:vocabId', articleAuth, vocabularies.update)
  //app.del('/vocabs/:vocabId', articleAuth, vocabularies.destroy)
  app.param('vocabId', vocabularies.load)
  

  // languages routes
  app.get('/dataset/lov/languages/:langIso639P3PCode', languages.show)
  app.param('langIso639P3PCode', languages.load)
  
  
  
  // article routes
 // app.get('/articles', articles.index)
 // app.get('/articles/new', auth.requiresLogin, articles.new)
 // app.post('/articles', auth.requiresLogin, articles.create)
 // app.get('/articles/:id', articles.show)
  //app.get('/articles/:id/edit', articleAuth, articles.edit)
  //app.put('/articles/:id', articleAuth, articles.update)
 // app.del('/articles/:id', articleAuth, articles.destroy)

  //app.param('id', articles.load)
  
  app.get('/dataset/lov/about', function(req, res){res.render('about', {});}  )
  
  // search
  app.get('/dataset/lov/terms', function(req, res){search.search(req,res,esclient);})
  app.get('/dataset/lov/searchMulti', function(req, res){searchMulti.search(req,res,esclient);})
  
  //Bot
  app.get('/dataset/lov/suggest', function(req, res){bot.isInLOV(req,res);})
  app.post('/dataset/lov/suggest',function(req, res){bot.submit(req,res,emailTransporter);})
  
  // tag routes
  //var tags = require('../app/controllers/tags')
  //app.get('/tags/:tag', tags.index)
  
  
  //APIs
  /*app.get('/suggest/terms', function(req, res){search.apiSuggestTerms(req,res,esclient);})
  app.get('/autocomplete/terms', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/autocomplete/vocabularies', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/search', function(req, res){search.apiSearch(req,res,esclient);})
  app.get('/searchTest', function(req, res){search.search(req,res,esclient);})*/
  
  app.get('/dataset/lov/api/v2/term/suggest', function(req, res){search.apiSuggestTerms(req,res,esclient);})
  app.get('/dataset/lov/api/v2/term/autocomplete', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/dataset/lov/api/v2/autocomplete/terms', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/dataset/lov/api/v2/term/autocompleteLabels', function(req, res){search.apiAutocompleteLabelsTerms(req,res,elasticsearchClient);})
  
  app.get('/dataset/lov/api/v2/term/search', function(req, res){search.apiSearch(req,res,esclient);})
  app.get('/dataset/lov/api/v2/search', function(req, res){search.apiSearch(req,res,esclient);})
  
  app.get('/dataset/lov/api/v2/agent/autocomplete', agents.autoComplete)
  app.get('/dataset/lov/api/v2/agent/search', function(req, res){search.apiSearchAgent(req,res,esclient);})
  app.get('/dataset/lov/api/v2/agent/list', function(req, res){agents.apiListAgents(req,res);})
  
  app.get('/dataset/lov/api/v2/vocabulary/autocomplete', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/dataset/lov/api/v2/autocomplete/vocabularies', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/dataset/lov/api/v2/vocabulary/list', function(req, res){vocabularies.apiListVocabs(req,res);})
  app.get('/dataset/lov/api/v2/vocabulary/search', function(req, res){search.apiSearchVocabs(req,res,esclient);})
  
  app.get('/dataset/lov/api', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/api/v1', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/api/v2', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/apidoc', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/sparql', function(req, res, next) {
    //TODO log SPARQL Queries using the logSearch object ??
    req.negotiate({
        'html': function() {
          res.render('endpoint/index', {queryExamples:queryExamples});
        },
        'default': function() {
          res.redirect('http://helium.okfnlabs.org:3030/lov/sparql?query='+ encodeURIComponent(req.query.query));
        }
    });
  });
  app.get('/endpoint/lov', function(req, res, next) {
    //TODO log SPARQL Queries using the logSearch object ??
    req.negotiate({
        'html': function() {
          res.render('endpoint/index', {queryExamples:queryExamples});
        },
        'default': function() {
          res.redirect('http://helium.okfnlabs.org:3030/lov/sparql?query='+ encodeURIComponent(req.query.query));
        }
    });
  });

}