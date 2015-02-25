/*!
 * Module dependencies.
 */

var async = require('async');

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , vocabularies = require('../app/controllers/vocabularies')
  , versions = require('../app/controllers/versions')
  , languages = require('../app/controllers/languages')
  , edition = require('../app/controllers/edition')
  , agents = require('../app/controllers/agents')
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

  /* ########### Edition ########### */
  //root and authentication
  app.get('/edition', function(req, res){res.redirect('/edition/lov/')})
  app.get('/edition/lov', auth.requiresLogin, edition.index)
  app.get('/edition/lov/signup', users.signup)
  app.get('/edition/lov/login', users.login)
  app.get('/edition/lov/logout', users.logout)
  app.post('/edition/lov/users', users.create)
  app.post('/edition/lov/session',
    passport.authenticate('local', {
     failureRedirect: '/edition/lov/login',
      failureFlash: true
    }), users.session)
  //global actions
  app.post('/edition/lov/usersReview', auth.requiresLogin, edition.reviewUsersBatch)
  app.post('/edition/lov/suggestTakeAction', auth.requiresLogin, edition.suggestTakeAction)
  app.post('/edition/lov/suggestUpdateStatus', auth.requiresLogin, edition.suggestUpdateStatus)
  //users
  app.get('/edition/lov/users', auth.requiresAdmin, users.index)
  app.post('/edition/lov/userChangeCategory', auth.requiresAdmin, users.userChangeCategory)
  app.del('/edition/lov/users/:userId', auth.requiresAdmin, users.destroy)
  app.get('/edition/lov/users/:userId', auth.requiresAdminOrUser, users.edit)
  app.put('/edition/lov/users/:userId', auth.requiresAdminOrUser, users.update)
  app.param('userId', users.load)
  //agents
  app.get('/edition/lov/agents/new', auth.requiresLogin, agents.new);
  app.get('/edition/lov/agents/:agentId', auth.requiresLogin, agents.edit)
  app.post('/edition/lov/agents', auth.requiresLogin, agents.create)
  app.put('/edition/lov/agents/:agentId', auth.requiresLogin, agents.update)
  app.del('/edition/lov/agents/:agentId', auth.requiresLogin, agents.destroy)
  app.param('agentId', agents.load)
  //vocabs
  app.post('/edition/lov/vocabs/new', auth.requiresLogin, vocabularies.new)
  app.get('/edition/lov/vocabs/:vocabPx', auth.requiresLogin, vocabularies.edit)
  app.post('/edition/lov/vocabs', auth.requiresLogin, vocabularies.create)
  app.put('/edition/lov/vocabs/:vocabPx', auth.requiresLogin, vocabularies.update)
  //app.get('/vocabs/:vocabPx/edit', articleAuth, vocabularies.edit)
  //app.put('/vocabs/:vocabPx', articleAuth, vocabularies.update)
  //app.del('/vocabs/:vocabPx', articleAuth, vocabularies.destroy)
  //versions
  app.get('/edition/lov/vocabs/:vocabPx/versions', auth.requiresLogin, versions.list)
  app.del('/edition/lov/vocabs/:vocabPx/versions', auth.requiresLogin, versions.remove)
  app.post('/edition/lov/vocabs/:vocabPx/versions/review', auth.requiresLogin, versions.changeStatusReviewed)
  app.post('/edition/lov/vocabs/:vocabPx/versions/reviewAll', auth.requiresLogin, versions.changeStatusReviewedAll)
  app.post('/edition/lov/vocabs/:vocabPx/versions/edit', auth.requiresLogin, versions.edit)
  app.post('/edition/lov/vocabs/:vocabPx/versions/new', auth.requiresLogin, versions.new)
  
  // agent
  app.get('/dataset/lov/agents', function(req, res){search.searchAgent(req,res,esclient);})
  app.get('/dataset/lov/agents/:agentName', agents.show)
  app.param('agentName', agents.loadFromName)

  
  // vocabs routes

  app.get('/', function(req, res){res.redirect('/dataset/lov/')})
  app.get('/dataset', function(req, res){res.redirect('/dataset/lov/')})
  app.get('/dataset/lov', vocabularies.index)
  app.get('/dataset/lov/vocabs', function(req, res){search.searchVocabulary(req,res,esclient);})
  app.get('/dataset/lov/vocabs/:vocabPx/versions/:vocabPx-:date.n3', function(req, res) {
    res.set('Content-Type', 'text/n3');
    res.download(require('path').resolve(__dirname+'/../versions/'+req.vocab._id+'/'+req.vocab._id+'_'+req.params.date+'.n3'),req.params.vocabId+'-'+req.params.date+'.n3');
});
  app.get('/dataset/lov/vocabs/:vocabPx', vocabularies.show)
  app.get('/dataset/lov/details/vocabulary:vocabularyid', function(req, res) {
    var vocabularyId=req.param('vocabularyid');
    if(vocabularyId){
      var prefix = vocabularyId.substring(1,vocabularyId.indexOf(".html"));
      res.redirect('/dataset/lov/vocabs/'+ prefix);
    }
    else res.redirect('/dataset/lov/');
  });
  //app.get('/vocabs/new', auth.requiresLogin, vocabularies.new)
  //app.post('/vocabs', auth.requiresLogin, vocabularies.create)
  //app.get('/vocabs/:vocabPx/edit', articleAuth, vocabularies.edit)
  //app.put('/vocabs/:vocabPx', articleAuth, vocabularies.update)
  //app.del('/vocabs/:vocabPx', articleAuth, vocabularies.destroy)
  app.param('vocabPx', vocabularies.load)
  

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
  //app.get('/dataset/lov/searchMulti', function(req, res){searchMulti.search(req,res,esclient);})
  
  //Bot
  app.get('/dataset/lov/suggest', function(req, res){bot.isInLOV(req,res);})
  app.post('/dataset/lov/suggest',function(req, res){bot.submit(req,res,emailTransporter);})
  
  // tag routes
  //var tags = require('../app/controllers/tags')
  //app.get('/tags/:tag', tags.index)
  
  
  //APIs  
  app.get('/dataset/lov/api/v2/term/suggest', function(req, res){search.apiSuggestTerms(req,res,esclient);})
  app.get('/dataset/lov/api/v2/term/autocomplete', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/dataset/lov/api/v2/autocomplete/terms', function(req, res){search.apiAutocompleteTerms(req,res,esclient);})
  app.get('/dataset/lov/api/v2/term/autocompleteLabels', function(req, res){search.apiAutocompleteLabelsTerms(req,res,elasticsearchClient);})
  
  app.get('/dataset/lov/api/v2/term/search', function(req, res){search.apiSearch(req,res,esclient);})
  app.get('/dataset/lov/api/v2/search', function(req, res){search.apiSearch(req,res,esclient);})
  
  app.get('/dataset/lov/api/v2/agent/autocomplete', agents.autoComplete)
  app.get('/dataset/lov/api/v2/agent/autocompleteFull', agents.autoCompleteFull)
  app.get('/dataset/lov/api/v2/agent/search', function(req, res){search.apiSearchAgent(req,res,esclient);})
  app.get('/dataset/lov/api/v2/agent/list', function(req, res){agents.apiListAgents(req,res);})
  app.get('/dataset/lov/api/v2/agent/info', function(req, res){agents.apiInfoAgent(req,res);})
  
  app.get('/dataset/lov/api/v2/vocabulary/autocomplete', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/dataset/lov/api/v2/autocomplete/vocabularies', function(req, res){search.apiAutocompleteVocabs(req,res,esclient);})
  app.get('/dataset/lov/api/v2/vocabulary/list', function(req, res){vocabularies.apiListVocabs(req,res);})
  app.get('/dataset/lov/api/v2/vocabulary/search', function(req, res){search.apiSearchVocabs(req,res,esclient);})
  app.get('/dataset/lov/api/v2/vocabulary/info', function(req, res){vocabularies.apiInfoVocab(req,res);})
  app.get('/dataset/lov/api/v2/vocabulary/prefix/exists', function(req, res){vocabularies.apiPrefixExists(req,res);})
  
  app.get('/dataset/lov/api/v2/tags/list', function(req, res){vocabularies.apiTags(req,res);})
  
  app.get('/dataset/lov/api', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/api/v1', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/api/v2', function(req, res){res.render('api', {});}  )
  app.get('/dataset/lov/apidoc', function(req, res){res.render('api', {});}  )
  
  
  /* Vocommons */
  app.get('/vocommons', function(req, res){res.redirect('/vocommons/voaf/')});
  app.get('/vocommons/voaf', function(req, res, next) {
    req.negotiate({
        'application/rdf+xml': function() {
           res.set('Content-Type', 'application/rdf+xml');
           res.download(require('path').resolve(__dirname+'/../vocommons/voaf/v2.3/voaf_v2.3.rdf'));
        },
        'html,default': function() {res.redirect('/vocommons/voaf/v2.3/');}
    });
  });
  
  app.get('/endpoint/lov', function(req, res){res.redirect('/dataset/lov/sparql')});
  app.get('/dataset/lov/sparql', function(req, res, next) {
    //TODO log SPARQL Queries using the logSearch object ??
    req.negotiate({'application/sparql-results+json,application/sparql-results+xml,text/tab-separated-values,text/csv,application/json,application/xml': function() {
          res.redirect('http://helium.okfnlabs.org:3030/lov/sparql?query='+ encodeURIComponent(req.query.query));
        },
        'html': function() {
          res.render('endpoint/index', {queryExamples:queryExamples});
        },
        'default': function() {
          res.redirect('http://helium.okfnlabs.org:3030/lov/sparql?query='+ encodeURIComponent(req.query.query));
        }
    });
  });
  

}