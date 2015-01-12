var utils = require('../../lib/utils');
var dagre = require("dagre");
var fs = require('fs');
var file = __dirname + '../../../public/test.json';

var indexName = 'lov'; /* Name of the ElasticSearch index */

/* **********************
  ENTRYPOINT FUNCTIONS
********************** */
/**
 * Full text search used by the search UI
 */
exports.search = function (req, res, esclient) {
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    res.render('searchMulti/index',{
      utils: utils,
      dagre: dagre,
      results: JSON.parse(data)
    });
  });
  
}

/* ************
  FUNCTIONS
************ */



/* return a notification of a bad request */
function standardBadRequestHandler(req, res, helpText) {
  res.set('Content-Type', 'text/plain');
  return res.send(400, helpText);
};

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