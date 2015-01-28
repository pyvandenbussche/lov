/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , Vocabulary = mongoose.model('Vocabulary')
  , Statvocabulary = mongoose.model('Statvocabulary')
  , Stattag = mongoose.model('Stattag')
  , LogSearch = mongoose.model('LogSearch')
  , utils = require('../../lib/utils')
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
      
      outNodes.push({name:statvocab.prefix, nbIncomingLinks:((statvocab.nbIncomingLinks>0)?statvocab.nbIncomingLinks:1), group:2});
      inNodes.push({name:statvocab.prefix, nbIncomingLinks:((statvocab.nbIncomingLinks>0)?statvocab.nbIncomingLinks:1), group:2});
      if(typeof(statvocab) != 'undefined'){
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

/*exports.index = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30
  var options = {
    perPage: perPage,
    page: page
  }

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count().exec(function (err, count) {
      res.render('articles/index', {
        title: 'Articles',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })  
}*/
