var utils = require('../../lib/utils');
var dagre = require("dagre");
var fs = require('fs');
var file = __dirname + '../../../public/test.json';
var http = require('http');

var indexName = 'lov'; /* Name of the ElasticSearch index */

/* **********************
  ENTRYPOINT FUNCTIONS
********************** */
/**
 * Full text search used by the search UI
 */
exports.search = function (req, res, esclient) {
  if(req.query.q){
    var kws = req.query.q.split(';');
    if( kws.length>1){
      console.log('Search for terms "'+kws+'"')
      
      var options = {hostname: 'localhost',port: 8181,path: '/vocreco/rest/reco?q='+req.query.q};
      http.get(options, function(response) {
            var bodyChunks = [];
            response.on('data', function(d) {bodyChunks.push(d);});// Continuously update stream with data
            response.on('end', function() {
              var body = Buffer.concat(bodyChunks);    
              res.render('searchMulti/index',{
                    utils: utils,
                    dagre: dagre,
                    results: JSON.parse(body)
                  });     
            });
      });
  
      /*fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
          console.log('Error: ' + err);
          return;
        }
        res.render('searchMulti/index',{
          utils: utils,
          dagre: dagre,
          results: JSON.parse(data)
        });
      });*/
    }
    else{
      res.render('searchMulti/index',{utils: utils,dagre: dagre});
    }
  }
  else{
    res.render('searchMulti/index',{utils: utils,dagre: dagre});
  }
  
  
  

  
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