/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , LogSearch = mongoose.model('LogSearch')
  , LogSparql = mongoose.model('LogSparql')
  , utils = require('../../lib/utils')
 

/**
* LOG SPARQL API
*/
exports.apiSPARQL = function (req, res) {
  LogSparql.list(function(err, logs) {
    if (err) return res.render('500')
    return standardCallback(req, res, err, logs);
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