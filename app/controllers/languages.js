/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , Language = mongoose.model('Language')
  , Statlanguage = mongoose.model('Statlanguage')
  , utils = require('../../lib/utils')
  , _ = require('underscore')

 /**
 * Load
 */

exports.load = function(req, res, next, iso639P3PCode){
  Language.loadByIso639P3PCode(iso639P3PCode, function (err, lang) {
    if (err) return next(err)    
    if (!lang) return next(new Error('Language '+iso639P3PCode+' not found'))
    req.lang = lang
    next()
  })
}

/**
 * Show
 */
exports.show = function(req, res){
  Statlanguage.mostPopularLangs(function (err, mostPopularLangs) {
    //build the JSON object for the elements chart
    var values= [];
      for(i=0; i< ((mostPopularLangs.length>10)?10:mostPopularLangs.length); i++){
        values.push({label : mostPopularLangs[i].label ,value : parseInt(mostPopularLangs[i].nbOccurrences)});
      }
    vocabElementsData =  [{key: "Number of vocabularies in ",values: values}];
    var nbOccurrences = 0;
    for(i=0; i<mostPopularLangs.length; i++){
      if(mostPopularLangs[i].label===req.lang.iso639P3PCode)nbOccurrences=mostPopularLangs[i].nbOccurrences;
    }
  
    if (err) return res.render('500')
    res.render('languages/show', {
      lang: req.lang,
      utils: utils,
      nbOccurrences: nbOccurrences,
      vocabElementsData: vocabElementsData
    })  
  })
}

