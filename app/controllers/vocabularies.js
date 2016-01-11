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
  , fs = require('fs')
  , _ = require('underscore')

/**
 * List
 */
exports.index = function(req, res){
  Vocabulary.list( function(err, vocabs) {
    if (err) return res.render('500')
    Stattag.mostPopularTags(30, function(err, tagsMostPopular) {
      Statvocabulary.mostLOVIncomingLinks(0, function(err, vocabsMostLOVIncomingLinks) {
        Vocabulary.latestInsertion(5, function(err, vocabsLatestInsertion) {
          if (err) return res.render('500')
          Vocabulary.latestModification(5, function(err, vocabsLatestModification) {
            if (err) return res.render('500')
            //vocabsMostLOVIncomingLinks.unshift(JSON.stringify({ 'nbIncomingLinks': vocabsMostLOVIncomingLinks[0].nbIncomingLinks+50, prefix: '...' }));
            res.render('index', {
              title: 'Articles',
              utils: utils,
              vocabs: vocabs,
              vocabsLatestInsertion: vocabsLatestInsertion,
              vocabsLatestModification: vocabsLatestModification,
              vocabsMostLOVIncomingLinks:vocabsMostLOVIncomingLinks,
              tagsMostPopular: tagsMostPopular
            })
          })
        })
      })
    })
  })
 }
 
 /**
* Vocabulary List API
*/
exports.apiListVocabs = function (req, res) {
  Vocabulary.listPrefixNspUriTitles(function(err, vocabs) {
    if (err) return res.render('500')
    //store log in DB
    var log = new LogSearch({
      searchURL: req.originalUrl,
      date: new Date(),
      category: "vocabularyList",
      method: "api",
      nbResults: vocabs.length  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    return standardCallback(req, res, err, vocabs);
  })
}

/**
* Vocabulary Prefix Exists API
*/
exports.apiPrefixExists = function (req, res) {
  if (!(req.query.prefix!=null)) return res.send(500, "You must provide a value for 'prefix' parameter");
  Vocabulary.testIfPrefixExists(req.query.prefix,function(err, count) {
    return standardCallback(req, res, err, {count:count});
  })
}


 /**
* Vocabulary Tags List API
*/
exports.apiTags = function (req, res) {
  Stattag.list(function(err, tags) {
    if (err) return res.render('500')
    return standardCallback(req, res, err, tags);
  })
}

 /**
* Vocabulary Info API
*/
exports.apiInfoVocab = function (req, res) {
  if (!(req.query.vocab!=null)) return res.send(500, "You must provide a value for 'vocab' parameter");
  Vocabulary.loadFromPrefixURINSP(req.query.vocab, function (err, vocab) {
    if (err) return res.send(500, err);
    //store log in DB
    var exists = (vocab)?1:0;
    var log = new LogSearch({
      searchURL: req.originalUrl,
      date: new Date(),
      category: "vocabularyInfo",
      method: "api",
      nbResults: exists  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    return standardCallback(req, res, err, vocab);
  })
}


 /**
* Vocabulary JSON-LD context List
*/
exports.jsonLDListVocabs = function (req, res) {
  Vocabulary.listPrefixNspUri(function(err, vocabs) {
    if (err) return res.send(500, err);
    var contexts= {};
    for (x in vocabs) {
        //console.log(vocabs[x].prefix);
        contexts[vocabs[x].prefix]= vocabs[x].nsp;
    }
    var out = { 
      "@context":contexts
    }
    return standardCallback(req, res, err, out);
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
 
/**
* Filter List
*/
exports.filterList = function(req, res){
  Vocabulary.filterListVocab(req.query.sort, req.query.tag, function(err, vocabs) {
    if (err) return res.render('500')
    res.render('vocabularies/index', {
      utils: utils,
      vocabs: vocabs
    })
  })
 }
 
 /**
 * Load
 */

exports.load = function(req, res, next, prefix){
  Vocabulary.load(prefix, function (err, vocab) {
    if (err) return next(err)    
    if (!vocab) return next(new Error('Vocabulary '+prefix+' not found'))
    req.vocab = vocab;
   // console.log(vocab);
    next()
  })
}

 /**
 * Load for edition without populating versions.languageIds
 */

exports.loadEdition = function(req, res, next, prefix){
  Vocabulary.loadEdition(prefix, function (err, vocab) {
    if (err) return next(err)    
    if (!vocab) return next(new Error('Vocabulary '+prefix+' not found'))
    req.vocab = vocab;
   // console.log(vocab);
    next()
  })
}



 /**
 * Load
 */

exports.loadId = function(req, res, next, id){
  Vocabulary.loadId(id, function (err, vocab) {
    if (err) return next(err)    
    if (!vocab) return next(new Error('Vocabulary '+id+' not found'))
    req.vocab = vocab
    next()
  })
}

/**
 * Show
 */
exports.show = function(req, res){
  Statvocabulary.load(req.vocab.uri, function(err, statvocab) {
    if (err) return res.render('500')
    var versions,lastVersion, timelineData,x, vocabElementsData;
    if(typeof(req.vocab) != 'undefined'){
   
    
      if(req.vocab.versions && req.vocab.versions.length>0){
        for (i in req.vocab.versions){
          if(typeof(lastVersion) == 'undefined')lastVersion = req.vocab.versions[i];
          else{
            if(lastVersion.issued < req.vocab.versions[i].issued)lastVersion = req.vocab.versions[i];
          }
        }
        function compare(a,b) {
          if (a.issued < b.issued)
            return -1;
          return 1;
        }
        versions = req.vocab.versions.sort(compare);
      }
      
      //build the JSON Object for the timeline
      
      timelineData = [];
      if(versions){
        for (var i = 0; i < versions.length; i++) {
          version = versions[i];
          x={};
          
          x.start = utils.dateToYMD(version.issued);
          if((i+1)<versions.length){x.end = utils.dateToYMD(versions[i+1].issued);}
          x.icon = '/img/cursor.png';
          x.color = '#9CF';
          x.description = '';
          x.textColor ='#666';
          x.title = version.name;
          x.caption = req.vocab.prefix+' '+version.name;
          if(version.fileURL)x.link = version.fileURL;
                    
          timelineData.push(x);
        }
      }
      
      //build the outcoming graph
      
      var outNodes = [];
      var outLinks = [];
      var inNodes = [];
      var inLinks = [];
      var cpt=0;
      
      
      if(statvocab && typeof(statvocab) != 'undefined'){
      
        outNodes.push({name:statvocab.prefix, nbIncomingLinks:((statvocab.nbIncomingLinks>0)?statvocab.nbIncomingLinks:1), group:2});
        inNodes.push({name:statvocab.prefix, nbIncomingLinks:((statvocab.nbIncomingLinks>0)?statvocab.nbIncomingLinks:1), group:2});
      //generate the data for the outgoing links
        cpt = pushNodesLinks(statvocab.outRelMetadata,true,13, outNodes, outLinks, cpt);
        cpt = pushNodesLinks(statvocab.outRelExtends,false,4, outNodes, outLinks, cpt);
        cpt = pushNodesLinks(statvocab.outRelSpecializes,false,0, outNodes, outLinks, cpt);
        cpt = pushNodesLinks(statvocab.outRelGeneralizes,false,1, outNodes, outLinks, cpt);
        cpt = pushNodesLinks(statvocab.outRelEquivalent,false,14, outNodes, outLinks, cpt);
        cpt = pushNodesLinks(statvocab.outRelDisjunc,false,15, outNodes, outLinks, cpt);
        cpt = pushNodesLinks(statvocab.outRelImports,false,6, outNodes, outLinks, cpt);
      
      
      //generate the data for the incoming links
        cpt=0;
        cpt = pushNodesLinks(statvocab.incomRelMetadata,true,13, inNodes, inLinks, cpt);
        cpt = pushNodesLinks(statvocab.incomRelExtends,false,4, inNodes, inLinks, cpt);
        cpt = pushNodesLinks(statvocab.incomRelSpecializes,false,0, inNodes, inLinks, cpt);
        cpt = pushNodesLinks(statvocab.incomRelGeneralizes,false,1, inNodes, inLinks, cpt);
        cpt = pushNodesLinks(statvocab.incomRelEquivalent,false,14, inNodes, inLinks, cpt);
        cpt = pushNodesLinks(statvocab.incomRelDisjunc,false,15, inNodes, inLinks, cpt);
        cpt = pushNodesLinks(statvocab.incomRelImports,false,6, inNodes, inLinks, cpt);
      }
      else{
        outNodes.push({name:req.vocab.prefix, nbIncomingLinks:80, group:1});
        inNodes.push({name:req.vocab.prefix, nbIncomingLinks:80, group:1});
      }
      var outData = {};
      outData.nodes = outNodes;
      outData.links = outLinks;
      var inData = {};
      inData.nodes = inNodes;
      inData.links = inLinks;
      
      //build the JSON object for the elements chart
      if(lastVersion){
        vocabElementsData =  [{key: "Number of",
          values: [
            {label : "Classes" ,value : parseInt(lastVersion.classNumber)} , 
            {label : "Properties" ,value : parseInt(lastVersion.propertyNumber)} , 
            {label : "Datatypes" ,value : parseInt(lastVersion.datatypeNumber)} ,
            {label : "Instances" ,value : parseInt(lastVersion.instanceNumber)} 
          ]}];
       }
    }
    //console.log(lastVersion);
    res.render('vocabularies/show', {
      statvocab: statvocab,
      vocab: req.vocab,
      lastVersion: lastVersion,
      utils: utils,
      timelineData:{'events':timelineData},
      vocabElementsData:vocabElementsData,
      outData:outData,
      inData: inData
    })  
  })
}

exports.create = function (req, res) {
  var vocab = new Vocabulary(req.body);
  //console.log(vocab);
  
  vocab.save(function (err) {
    if (err) {return res.render('500')}
    
    /* store version locally */
    var command = "/usr/local/lov/scripts/bin/downloadVersion "+(vocab.isDefinedBy?vocab.isDefinedBy:vocab.uri)+" /usr/local/lov/scripts/lov.config";
    var exec = require('child_process').exec;
    child = exec(command,
      function (error, stdout, stderr) {
        stdout = stdout.split('\n')[0];
        if(error !== null){
          console.log('exec error: ' + error);
        }
        if(stdout && stdout.length>0){
          /* move file with its name */
          var version = {};
          var versionIssued = new Date();
          
          var d = versionIssued.getDate();
          var m = versionIssued.getMonth() + 1;
          var y = versionIssued.getFullYear();
          var issuedStr = '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
          var versionName = 'v'+issuedStr;
          
          version.issued = versionIssued;
          version.name = versionName;
          version.isReviewed = true;
          
          var dir = './versions/'+vocab._id;
          if (!fs.existsSync(dir))fs.mkdirSync(dir);
          
          var target_path = './versions/'+vocab._id+'/' +vocab._id+'_'+ issuedStr+'.n3' //req.files.file.name;
          // move the file from the temporary location to the intended location
          fs.rename(stdout, target_path, function(err) {
              if (err) throw err;
              // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
              fs.unlink(stdout, function() {
                  if (err) throw err;
                  var versionPublicPath = "http://lov.okfn.org/dataset/lov/vocabs/"+vocab.prefix+"/versions/"+issuedStr+".n3";
                  /* run analytics on vocab */
                   var command2 = "/usr/local/lov/scripts/bin/versionAnalyser "+versionPublicPath+" "+vocab.uri+" "+vocab.nsp+" /usr/local/lov/scripts/lov.config";
                  var exec2 = require('child_process').exec;
                  child = exec2(command2, function (error2, stdout2, stderr2) {
                      stdout2 = JSON.parse(stdout2);
                      if(error2 !== null){
                        console.log('exec error2: ' + error2);
                      }
                      stdout2 = _.extend(stdout2, version);
                      /* add version */
                       Vocabulary.addVersion(vocab.prefix, stdout2, function(err) {
                          if (err) {return res.render('500')}
                          //console.log('Done!');
                          
                            //success generate first stats
                            var command3 = "/usr/local/lov/scripts/bin/statsonevocab /usr/local/lov/scripts/lov.config "+vocab.uri;
                            var exec3 = require('child_process').exec;
                            child = exec3(command3, function (error3, stdout3, stderr3) {
                              if(error3 !== null){
                                console.log('exec error3: ' + error3);
                              }
                              return res.send({redirect:'/dataset/lov/vocabs/'+vocab.prefix})
                            });
                        });
                  });
              });
          });  
        }
        else{//no version found
          return res.send({redirect:'/dataset/lov/vocabs/'+vocab.prefix})
        }
    });
  })
}

exports.update = function(req, res){
  var vocab = req.vocab;
  vocab = _.extend(vocab, req.body)
  //console.log(vocab);
  vocab.save(function(err) {
    if (err) {
      return res.render('500')
    }
    return res.send({redirect:'/dataset/lov/vocabs/'+vocab.prefix})
  })
  
}

exports.edit = function (req, res) {
  Language.listAll(function(err, langs) {
    if (err) return res.render('500')
    Stattag.list(function(err, listTags) {
      if (err) return res.render('500')
      
      //var stdout={"nbTriplesWithoutInf":104,"uri":"http://www.ics.forth.gr/isl/oncm/core","uriInputSearch":"http://www.ics.forth.gr/isl/oncm/core.owl","uriDeclared":"http://www.ics.forth.gr/isl/oncm/core","nsp":"http://www.ics.forth.gr/isl/oncm/core#","nspMostUsed":"http://www.ics.forth.gr/isl/oncm/core#","nspDefault":"http://www.ics.forth.gr/isl/oncm/core#","prefix":"onc","prefixAssociatedNsp":"onc","nbClasses":8,"nbProperties":13,"nbInstances":0,"nbDatatypes":0,"languages":[{"id":"54b2be018433ca9ccf1c0e0c","uri":"http://id.loc.gov/vocabulary/iso639-2/eng","label":"English","iso639P3PCode":"eng","iso639P1Code":"en"}],"titles":[{"value":"Open NEE Configuration Model","lang":"en"},{"value":"The Open NEE Configuration Model","lang":"en"}],"descriptions":[{"value":"The Open NEE Configuration Model defines a Linked Data-based model for describing a configuration supported by a Named Entity Extraction (NEE) service. It is based on the model proposed in \"Configuring Named Entity Extraction through Real-Time Exploitation of Linked Data\" (http://dl.acm.org/citation.cfm?doid\u003d2611040.2611085) for configuring such services, and allows a NEE service to describe and publish as Linked Data its entity mining capabilities, but also to be dynamically configured.","lang":"en"}],"creators":[{"prefUri":"http://users.ics.forth.gr/~fafalios"}],"contributors":[{"prefUri":"http://users.ics.forth.gr/~tzitzik"}],"relMetadata":[{"nbTriplesWithoutInf":0,"uri":"http://purl.org/dc/terms/","nsp":"http://purl.org/dc/terms/","prefix":"dcterms","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0},{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/1999/02/22-rdf-syntax-ns#","nsp":"http://www.w3.org/1999/02/22-rdf-syntax-ns#","prefix":"rdf","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0},{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/2000/01/rdf-schema#","nsp":"http://www.w3.org/2000/01/rdf-schema#","prefix":"rdfs","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0},{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/2002/07/owl","nsp":"http://www.w3.org/2002/07/owl#","prefix":"owl","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0}],"relSpecializes":[{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/2000/01/rdf-schema#","nsp":"http://www.w3.org/2000/01/rdf-schema#","prefix":"rdfs","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0},{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/2004/02/skos/core","nsp":"http://www.w3.org/2004/02/skos/core#","prefix":"skos","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0}],"relGeneralizes":[],"relExtends":[{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/2000/01/rdf-schema#","nsp":"http://www.w3.org/2000/01/rdf-schema#","prefix":"rdfs","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0}],"relEquivalent":[],"relDisjunc":[],"relImports":[{"nbTriplesWithoutInf":0,"uri":"http://www.w3.org/2004/02/skos/","nbClasses":0,"nbProperties":0,"nbInstances":0,"nbDatatypes":0}]}
      var command = "/usr/local/lov/scripts/bin/suggest "+(req.vocab.isDefinedBy?req.vocab.isDefinedBy:req.vocab.uri)+" /usr/local/lov/scripts/lov.config";
        var exec = require('child_process').exec;
        child = exec(command,{timeout:5000},
          function (error, stdout, stderr) {
            if(stderr.length<4){
              if(stdout) stdout = JSON.parse(stdout);
            }
            if(error !== null){
              console.log('exec error: ' + error);
            }
             res.render('vocabularies/edit', {
              stdout:stdout,
              vocab: req.vocab,
              langs: langs,
              listTags:listTags,
              profile:req.user,
              utils: utils
            });
        });
      
    });
  });
}

exports.new = function (req, res) {
  //test if the vocabulary already exist or not
  if (!req.body.uri) { //control that q param is present
      req.flash('error', 'You must specify a vocabulary URI')
      res.redirect('/edition/lov')
  } else {
    //console.log(req.body.uri)
    Vocabulary.findNspURI(req.body.uri, function(err, vocab) {
      if (err) return res.render('500')
      if(vocab){ //vocab already exist
        req.flash('error', 'This vocabulary already exists')
        res.redirect('/edition/lov')
      }
      else{ //vocab does not exist yet*/
        Language.listAll(function(err, langs) {
          if (err) return res.render('500')
          Stattag.list(function(err, listTags) {
            if (err) return res.render('500')
            var command = "/usr/local/lov/scripts/bin/suggest "+req.body.uri+" /usr/local/lov/scripts/lov.config";
            var exec = require('child_process').exec;
            child = exec(command,
              function (error, stdout, stderr) {
                if(stderr.length<4)stdout = JSON.parse(stdout);
                if(error !== null){
                  console.log('exec error: ' + error);
                }
                res.render('vocabularies/new', {
                  stdout:stdout,
                  vocab: new Vocabulary({}),
                  langs: langs,
                  listTags: listTags,
                  profile:req.user,
                  utils: utils
                });
            });
          });
        });
      }
    })
  }
}

/**
* vocabList : The relation array containing vocab Objects
* isFilterOut : indicate if we have to filter out rdf, rdfs, owl and xsd vocabs
* group : relation identifier
* outNodes : json array containing the nodes
* outLinks : json array containing the links
* cpt : node identifier
**/
function pushNodesLinks(vocabList,isFilterOut,group, nodes, links, cpt){
  var filterMetadataArray = ["rdf","rdfs","owl","xsd"];
  if(typeof(vocabList) != 'undefined'){
    for (x = 0; x < vocabList.length; x++) {
      if(isFilterOut && filterMetadataArray.indexOf(vocabList[x].prefix)>0){}
      else{
          cpt++;
          var nbIncomLinks = (vocabList[x].nbIncomingLinks>0)?vocabList[x].nbIncomingLinks:1;
          nodes.push({name:vocabList[x].prefix, nbIncomingLinks:nbIncomLinks, group:group});
          links.push({source:cpt, target:0, value:2});
      }
    }
  }
  return cpt;
}
