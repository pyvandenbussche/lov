
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


exports.reviewUsersBatch = function(req, res){
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

exports.suggestTakeAction = function(req, res){
  LogSuggest.update({_id:req.body.suggId},{$set:{reviewedBy:req.user.agent}}).exec(function(err, suggest) {
      if (err) return res.render('500')
      res.redirect('/edition/lov/');
  });  
}

exports.suggestUpdateStatus = function(req, res){
  LogSuggest.update({_id:req.body.suggId},{$set:{status:req.body.status}}).exec(function(err, suggest) {
      if (err) return res.render('500')
      res.redirect('/edition/lov/');
  });  
}


exports.index = function(req, res){
  Vocabulary.listVocabsForReview(function (err, vocabsForReview) {
    LogSuggest.listActive(function (err, suggests) {
      User.listUsersForReview(function (err, users) {
        Vocabulary.listVocabVersionsToReview(function (err, vocabsVersionsForReview) {
          res.render('edition', {
            utils: utils,
            users:users,
            suggests:suggests,
            vocabsForReview:vocabsForReview,
            vocabsVersionsForReview:vocabsVersionsForReview,
            auth:req.user
          })
        })
      })
    })
  })
 }
