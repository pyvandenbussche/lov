/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , Vocabulary = mongoose.model('Vocabulary')
  , Language = mongoose.model('Language')
  , Statvocabulary = mongoose.model('Statvocabulary')
  , Stattag = mongoose.model('Stattag')
  , LogSearch = mongoose.model('LogSearch')
  , utils = require('../../lib/utils')
  , _ = require('underscore')



exports.list = function (req, res) {
  res.render('versions/edit', {
    vocab: req.vocab,
    profile:req.user,
    utils: utils
  });
}

exports.remove = function (req, res) {
  var versionIssued = Date.parse(req.body.issued);
  var versionName = req.body.name;
  var vocab = req.vocab;
  
  //remove the selected version
  for (i = 0; i < vocab.versions.length; i++) { 
    var version = vocab.versions[i];
    console.log(version.issued+' - '+req.body.issued+' - '+(Date.parse(version.issued) === versionIssued));
    console.log(version.name+' - '+versionName+' - '+(version.name === versionName));
    if(Date.parse(version.issued) === versionIssued && version.name === versionName){
      console.log(vocab.versions.length);
      vocab.versions.splice(i,1);
      console.log(vocab.versions.length);
      break
    }
    console.log(vocab.versions.length);
  }
  
  vocab.save(function(err) {
    if (err) {
      return res.render('500')
    }
    return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
  })
}