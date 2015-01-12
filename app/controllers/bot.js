var utils = require('../../lib/utils');

var mongoose = require('mongoose')
  , Vocabulary = mongoose.model('Vocabulary')
  , LogSuggest = mongoose.model('LogSuggest')
  , User = mongoose.model('User')

var jarPath = 'C:/Users/vandenbusschep/Documents/SVN/PYV_Repository/lovSuggest/build/lovSuggest'; /* Name of the  suggest jar file */

/* **********************
  ENTRYPOINT FUNCTIONS
********************** */

exports.isInLOV = function (req, res) {
  //test if the vocabulary already exist or not
  if (!req.query.q) { //control that q param is present
                res.render('suggest/index',{utils: utils});
        } else {
    Vocabulary.findNspURI(req.query.q, function(err, vocab) {
      if (err) return res.render('500')
      if(vocab){ //vocab already exist
        res.render('suggest/index', {
          vocab: vocab,
          suggestion: req.query.q,
          utils: utils
        })
      }
      else{ //vocab does not exist yet
        /* run the bot on the URL */
        console.log(req.query.q)
        var command = "/usr/local/lov/scripts/bin/suggest "+req.query.q+" /usr/local/lov/scripts/lov.config";
        var exec = require('child_process').exec;
        child = exec(command,
          function (error, stdout, stderr) {
            if(stderr.length<4)stdout = JSON.parse(stdout);
            if(error !== null){
              console.log('exec error: ' + error);
            }
             res.render('suggest/index', {
              suggestion: req.query.q,
              stdout:stdout,
              stderr:stderr,
              utils: utils
            })
        });
      }
    })
  }
}


exports.submit = function (req, res, emailTransporter) {
  if(req.body.data && req.body.data.length>4){
    var data = JSON.parse(req.body.data);
    //store log in DB
    var log = new LogSuggest({
      suggestedBy: req.body.email,
      uri: data.uriInputSearch,
      date: new Date(),
      status: "suggested" 
    });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    console.log('vocabulary: '+data.uriInputSearch+' suggested by email: '+req.body.email);
    
    // preparation of the mail content based on the json object submitted
    var text = "Suggested by "+req.body.email;
    
    text += "\n\n # URI: "+data.uri;
    text += "\n\t URI suggested: "+data.uriInputSearch;
    text += "\n\t Declared URI: "+data.uriDeclared;
    
    text += "\n # Namespace: "+data.nsp;
    text += "\n\t Most used namespace: "+data.nspMostUsed;
    text += "\n\t Vann preferred namespace: "+data.nspVannPref;
    text += "\n\t Closest namespace: "+data.nspClosest;
    text += "\n\t Default namespace: "+data.nspDefault;
    
    text += "\n # Prefix: "+data.prefix;
    text += "\n\t Vann preferred prefix: "+data.prefixVannPref;
    text += "\n\t Prefix associated to the namespace: "+data.prefixAssociatedNsp;
    
    text += "\n";
    text += "\n Nb Classes: "+data.nbClasses;
    text += "\n Nb Properties: "+data.nbProperties;
    text += "\n Nb Instances: "+data.nbInstances;
    text += "\n Nb Datatypes: "+data.nbDatatypes;
    
    text += "\n";
    if(data.languages && data.languages.length>0){
      text += "\n Languages";
      for(i = 0; i < data.languages.length; i++) {
        var lang = data.languages[i];
        text += "\n\t "+(lang.label? lang.label:"##unknown##")+ " ("+lang.iso639P1Code+")";
      }
    }
    if(data.dateModified)text += "\n Date Modified: "+data.dateModified;
    if(data.dateIssued)text += "\n Date Issued: "+data.dateIssued;
    if(data.titles && data.titles.length>0){
      text += "\n Titles";
      for(i = 0; i < data.titles.length; i++) {
        var title = data.titles[i];
        text += "\n\t "+title.value+(title.lang? "@"+title.lang:"");
      }
    }
    if(data.descriptions && data.descriptions.length>0){
      text += "\n Descriptions";
      for(i = 0; i < data.descriptions.length; i++) {
        var description = data.descriptions[i];
        text += "\n\t "+description.value+(description.lang? "@"+description.lang:"");
      }
    }
    
    text += "\n";
    if(data.creators && data.creators.length>0){
      text += "\n Creators";
      for(i = 0; i < data.creators.length; i++) {
        var agent = data.creators[i];
        text += "\n\t "+agent.prefUri+(agent.name? " ("+agent.name+")":"");
      }
    }
    if(data.contributors && data.contributors.length>0){
      text += "\n Contributors";
      for(i = 0; i < data.contributors.length; i++) {
        var agent = data.contributors[i];
        text += "\n\t "+agent.prefUri+(agent.name? " ("+agent.name+")":"");
      }
    }
    if(data.publishers && data.publishers.length>0){
      text += "\n Publishers";
      for(i = 0; i < data.publishers.length; i++) {
        var agent = data.publishers[i];
        text += "\n\t "+agent.prefUri+(agent.name? " ("+agent.name+")":"");
      }
    }
    
    text += "\n";
    if(data.relMetadata && data.relMetadata.length>0){
      text += "\n uses Metadata ("+data.relMetadata.length+")";
      for(i = 0; i < data.relMetadata.length; i++) {
        var rel = data.relMetadata[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    if(data.relSpecializes && data.relSpecializes.length>0){
      text += "\n specializes ("+data.relSpecializes.length+")";
      for(i = 0; i < data.relSpecializes.length; i++) {
        var rel = data.relSpecializes[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    if(data.relGeneralizes && data.relGeneralizes.length>0){
      text += "\n generalizes ("+data.relGeneralizes.length+")";
      for(i = 0; i < data.relGeneralizes.length; i++) {
        var rel = data.relGeneralizes[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    if(data.relExtends && data.relExtends.length>0){
      text += "\n extends ("+data.relExtends.length+")";
      for(i = 0; i < data.relExtends.length; i++) {
        var rel = data.relExtends[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    if(data.relEquivalent && data.relEquivalent.length>0){
      text += "\n has equivalences with ("+data.relEquivalent.length+")";
      for(i = 0; i < data.relEquivalent.length; i++) {
        var rel = data.relEquivalent[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    if(data.relDisjunc && data.relDisjunc.length>0){
      text += "\n has disjunctions with ("+data.relDisjunc.length+")";
      for(i = 0; i < data.relDisjunc.length; i++) {
        var rel = data.relDisjunc[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    if(data.relImports && data.relImports.length>0){
      text += "\n imports ("+data.relImports.length+")";
      for(i = 0; i < data.relImports.length; i++) {
        var rel = data.relImports[i];
        text += "\n\t "+rel.uri+(rel.prefix? " ("+rel.prefix+")":"");
      }
    }
    
    //send email to admins
    User.listAdmin(function(err, users) {
      // setup e-mail data with unicode symbols
      var mailOptions = {
          from: "Linked Open Vocabularies <linkedopenvocabularies@gmail.com>", // sender address
          to: (function() { // list of receivers
            var admins="";
            for(i = 0; i < users.length; i++) {
              if(admins.length>1)admins+=",";
              admins+=users[i].email;
            }
            return admins;
          })(),//"py.vandenbussche@gmail.com",
          subject: "[LOV-suggestion] "+data.uriInputSearch, // Subject line
          text: text, // plaintext body
      }
      console.log(mailOptions);

      // send mail with defined transport object
      emailTransporter.sendMail(mailOptions, function(error, response){
          if(error){
              console.log(error);
          }else{
              console.log("Message sent: " + response.message);
          }

          // if you don't want to use this transport object anymore, uncomment following line
          //smtpTransport.close(); // shut down the connection pool, no more messages
      });
    })
    
    // setup e-mail data with unicode symbols for person who suggested
    var mailOptionsSender = {
        from: "Linked Open Vocabularies <linkedopenvocabularies@gmail.com>", // sender address
        to: req.body.email, // list of receivers
        subject: "[LOV-suggestion] "+data.uriInputSearch, // Subject line
        text: "Thank you for submitting the vocabulary: "+data.uriInputSearch+" to Linked Open Vocabularies.\nWe will review your vocabulary shortly and inform you as soon as it is integrated to the LOV.\n\n The LOV curation team.", // plaintext body
    }
    // send mail with defined transport object
    emailTransporter.sendMail(mailOptionsSender, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log("Message sent: " + response.message);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        //smtpTransport.close(); // shut down the connection pool, no more messages
    });
    
  }
  
  res.render('suggest/index', {
              suggestion: data.uriInputSearch,
              mailSent: req.body.email,
              utils: utils
            });
}


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