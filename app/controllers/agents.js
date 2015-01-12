
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Agent = mongoose.model('Agent')
  , Vocabulary = mongoose.model('Vocabulary')
  , LogSearch = mongoose.model('LogSearch')
  , utils = require('../../lib/utils')
  , _ = require('underscore')
  
  
/**
 * Load
 */

exports.load = function(req, res, next, name){
  Agent.load(name, function (err, agent) {
    if (err) return next(err)    
    if (!agent) return next(new Error('Agent '+name+' not found'))
    req.agent = agent
    next()
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  Vocabulary.listCreatedPerAgent(req.agent._id, function(err, creatVocabs) {
    if (err) return res.render('500')
    Vocabulary.listContributedPerAgent(req.agent._id, function(err, contribVocabs) {
      if (err) return res.render('500')
      Vocabulary.listPublishedPerAgent(req.agent._id, function(err, pubVocabs) {
        if (err) return res.render('500')
    
        /* prepare pie data*/
        var pieData = [[
                        { 
                          "label": "Creator",
                          "value" : (creatVocabs)?creatVocabs.length:0
                        } , 
                        { 
                          "label": "Contributor",
                          "value" : (contribVocabs)?contribVocabs.length:0
                        } , 
                        { 
                          "label": "Publisher",
                          "value" : (pubVocabs)?pubVocabs.length:0
                        }
                      ]];
                      
        /* prepare tags */
        var allVocabs = creatVocabs.concat(contribVocabs.concat(pubVocabs));
        var tags = [];
        if(allVocabs.length){
          for(i=0; i<allVocabs.length; i++){
            if(allVocabs[i].tags){
              for(j=0; j<allVocabs[i].tags.length; j++){
                if(tags.indexOf(allVocabs[i].tags[j])<0)tags.push(allVocabs[i].tags[j]);
              }
            }
          }
        }
        
        res.render('agents/show', {
          agent: req.agent,
          allVocabs: allVocabs,
          pieData: pieData,
          tags: tags
        })
      })
    })
  })
}

 /**
* Vocabulary List API
*/
exports.apiListAgents = function (req, res) {
  Agent.listAgents(function(err, agents) {
    if (err) return res.render('500')
    //store log in DB
    var log = new LogSearch({
      searchURL: req.originalUrl,
      date: new Date(),
      category: "agentList",
      method: "api",
      nbResults: agents.length  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    return standardCallback(req, res, err, agents);
  })
}

/* depending on result, send the appropriate response code */
function standardCallback(req, res, err, results) {
  if (err != null) {
    console.log(err);
    return res.send(500, err);
  } else if (!(results != null)) {
    return res.send(404, 'API returned no results');
  } else {
    return res.send(200, results);
  }
};

exports.autoComplete = function(req, res) {
   var regex = new RegExp(req.query["q"], 'i');
   var query = Agent.find({$or: [{name: regex},{prefUri: regex}]},{name:1,_id:0}).sort({name:1}).limit(10);
        
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