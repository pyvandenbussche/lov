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



exports.edit = function (req, res) {
  res.render('versions/edit', {
    vocab: req.vocab,
    profile:req.user,
    utils: utils
  });
}