var utils = require('../../lib/utils');
var fs = require('fs');
var http = require('http');
var questionAnswerExamples = require('../../lib/questionAnswerExamples');
var mongoose = require('mongoose');
var LogQA = mongoose.model('LogQA');

/* **********************
  ENTRYPOINT FUNCTIONS
********************** */
/**
 * Full text search used by the search UI
 */
exports.search = function (req, res, esclient) {
  if(req.query.q && req.query.q.length>1){      
      console.log(req.query.q)
        var command = "python /usr/local/lov/qa4lov/src/webapp/main.py '"+req.query.q+"'";
        var exec = require('child_process').exec;
        child = exec(command,
          function (error, stdout, stderr) {
            if(error !== null){
              console.log('exec error: ' + error);
            }
            
             var log = new LogQA({query: req.query.q,
               date: new Date(),
               isQuestionProcessed: (stdout.lastIndexOf("Sorry. I don't", 0) !== 0),
               isResultEmpty: (stdout.lastIndexOf("Sorry. I am", 0) === 0),
             });//console.log(log);
             log.save(function (err){if(err)console.log(err)});
            
             res.render('qa/index', {
              QAExamples: questionAnswerExamples,
              question: req.query.q,
              stdout:stdout,
              stderr:stderr,
              utils: utils
            })
        });
  }
  else{
    res.render('qa/index',{QAExamples:questionAnswerExamples, utils: utils});
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