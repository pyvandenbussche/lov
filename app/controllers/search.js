var utils = require('../../lib/utils');

var indexName = 'lov'; /* Name of the ElasticSearch index */
var placeholders = [ /* placeholder used in the input box */
"all you want to know about LOV!",
"LOV is all :)",
"be ready to fall in LOV!",
"all you need is LOV :)"
];

var mongoose = require('mongoose')
  , LogSearch = mongoose.model('LogSearch')

/* **********************
  ENTRYPOINT FUNCTIONS
********************** */
/**
 * Full text search used by the search UI
 */
exports.search = function (req, res, esclient) {
  if(req.query.q)console.log('Search for terms "'+req.query.q+'"')
  return execSearch(esclient, req.query.q, req.query.page_size, req.query.page, req.query.type, req.query.vocab, req.query.vocab_limit, req.query.tag, req.query.tag_limit,  function(err, results) {
    if (err) return res.render('500')
    //store log in DB
    var log = new LogSearch({searchWords: req.query.q,
      searchURL: req.originalUrl,
      date: new Date(),
      category: "termSearch",
      method: "ui",
      nbResults: results.total_results  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    if(results.results.length==0){/* case we have no result, then give some suggestions */
        return execSuggestTerms(esclient, req.query.q, req.query.suggest_size,req.query.type, function(err, suggestions) {
        res.render('search/index',{
          results: results,
          suggestions: suggestions.suggestions,
          placeholder: placeholders[(Math.floor(Math.random() * placeholders.length ))],
          utils: utils
        });
      });
    }
    else{
      res.render('search/index',{
        results: results,
        placeholder: placeholders[(Math.floor(Math.random() * placeholders.length ))],
        utils: utils
      });
    }
  });
}

/**
 * Search for vocabulary used by the /vocabs UI
 */
exports.searchVocabulary = function (req, res, esclient) {
  return execSearchVocabulary(esclient, req.query.q, req.query.page_size, req.query.page, req.query.tag, req.query.tag_limit, req.query.lang, req.query.lang_limit,  function(err, results) {
    if (err) return res.render('500')
    //store log in DB
    var log = new LogSearch({searchWords: req.query.q,
      searchURL: req.originalUrl,
      date: new Date(),
      category: "vocabularySearch",
      method: "ui",
      nbResults: results.total_results  });//console.log(log);
    log.save(function (err){if(err)console.log(err)});
    res.render('vocabularies/index',{
      results: results,
      placeholder: placeholders[(Math.floor(Math.random() * placeholders.length ))],
      utils: utils
    });
  });
}

/**
 * Search for agent used by the /agents UI
 */
exports.searchAgent = function (req, res, esclient) {
  return execSearchAgent(esclient, req.query.q, req.query.page_size, req.query.page, req.query.type, req.query.tag, req.query.tag_limit,  function(err, results) {
      if (err) return res.render('500')
      //store log in DB
      var log = new LogSearch({searchWords: req.query.q,
        searchURL: req.originalUrl,
        date: new Date(),
        category: "agentSearch",
        method: "ui",
        nbResults: results.total_results  });//console.log(log);
      log.save(function (err){if(err)console.log(err)});
      res.render('agents/index',{
        results: results,
        placeholder: placeholders[(Math.floor(Math.random() * placeholders.length ))],
        utils: utils
      });
  });
}

/**
 * Full text search used by Vocabs API
 */
exports.apiSearchVocabs = function (req, res, esclient) {
  if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
    return execSearchVocabulary(esclient, req.query.q, req.query.page_size, req.query.page, req.query.tag, req.query.tag_limit, req.query.lang, req.query.lang_limit,  function(err, results) {
        //store log in DB
        var log = new LogSearch({searchWords: req.query.q,
          searchURL: req.originalUrl,
          date: new Date(),
          category: "vocabularySearch",
          method: "api",
          nbResults: results.total_results  });//console.log(log);
        log.save(function (err){if(err)console.log(err)});
        return standardCallback(req, res, err, results);
    });
  }
}

/**
 * Full text search used by Agents API
 */
exports.apiSearchAgent = function (req, res, esclient) {
  if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
    return execSearchAgent(esclient, req.query.q, req.query.page_size, req.query.page, req.query.type, req.query.tag, req.query.tag_limit,  function(err, results) {
        //store log in DB
        var log = new LogSearch({searchWords: req.query.q,
          searchURL: req.originalUrl,
          date: new Date(),
          category: "agentSearch",
          method: "api",
          nbResults: results.total_results  });//console.log(log);
        log.save(function (err){if(err)console.log(err)});
        return standardCallback(req, res, err, results);
    });
  }
}

/**
* Full text search used by the API
*/
exports.apiSearch = function (req, res, esclient) {
  if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
		console.log('Search for terms "'+req.query.q+'"') //TODO store in a log
		return execSearch(esclient, req.query.q, req.query.page_size, req.query.page, req.query.type, req.query.vocab, req.query.vocab_limit, req.query.tag, req.query.tag_limit,  function(err, results) {
      //store log in DB
      var log = new LogSearch({searchWords: req.query.q,
        searchURL: req.originalUrl,
        date: new Date(),
        category: "termSearch",
        method: "api",
        nbResults: results.total_results  });//console.log(log);
      log.save(function (err){if(err)console.log(err)});
		  return standardCallback(req, res, err, results);
		});
	}
}

/**
* Terms Autocomplete API
*/
exports.apiAutocompleteTerms = function (req, res, esclient) {
	if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
		console.log('Autocomplete for terms starting with "'+req.query.q+'"')
		return execAutocompleteTerms(esclient, req.query.q, req.query.page_size, req.query.page, req.query.type, function(err, results) {
      //shall we log this or not? 
      return standardCallback(req, res, err, results);
    });
	}
}

/**
* Vocabulary Autocomplete API
*/
exports.apiAutocompleteVocabs = function (req, res, esclient) {
  if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
		console.log('Search for vocabularies starting with "'+req.query.q+'"')
		return execAutocompleteVocabularies(esclient, req.query.q, req.query.page_size, req.query.page, function(err, results) {
       //shall we log this or not? 
      return standardCallback(req, res, err, results);
		});
	}
}

/**
* Terms Suggest API
*/
exports.apiSuggestTerms = function (req, res, esclient) {
	if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
		console.log('Suggest for terms close to "'+req.query.q+'"')
		return execSuggestTerms(esclient, req.query.q, req.query.page_size,req.query.type, function(err, results) {
      //shall we log this or not? 
      return standardCallback(req, res, err, results);
    });
	}
}


/* ************
  FUNCTIONS
************ */
/**
* Execution of a full text search
*/
function execSearch(client, queryString, page_size, page, type, vocab, vocab_limit, tag, tag_limit, callback) {
  if(!vocab_limit || (!parseInt(vocab_limit) && vocab_limit!=='0') || parseInt(page_size)<1)vocab_limit=10;
  if(!tag_limit || (!parseInt(tag_limit) && tag_limit!=='0') || parseInt(page_size)<1)tag_limit=10;
  if(!type)type='class,property';
  if(!page_size || (!parseInt(page_size) && page_size!=='0') || parseInt(page_size)<1)page_size=10;
  if(!page || (!parseInt(page) && page!=='0') || parseInt(page)<1)page=1;
  page = parseInt(page, 10) || 1;
  
  /* Weights for subparts of the score function */ 
  var wHitScore=1.0; /* weight given to the similarity score */
  var wOccScore=0.3; /* weight given to the frequence of the term in LOD */
  var wDatScore=0.5; /* weight given to the number of datasets (in LOD) having at least one instance of the term */
  
  /* Weights for each field type in the score function */ 
  var weightLocalName=12;/* the local name of a URI */
  var weightPrimLabel=3;/* primary label includes rdfs:label, dcterms:title, dce:title, skos:prefLabel */
  var weightSecLabel=1.5;/* secondary label includes rdfs:comment, dcterms:description, dce:description, skos:altLabel */
  var weightVocabularyInfo=1;/* weight for matches on fields belonging to the vocabulary document of a vocabulary term */
  
  /* fields concerned by the query and their corresponding boost */
  var fieldToSearchOn= [
  "http://www.*",
  "localName.ngram^"+weightLocalName,
  "http://www.w3.org/2000/01/rdf-schema#label*^"+weightPrimLabel, 
  "http://purl.org/dc/terms/title*^"+weightPrimLabel, 
  "http://purl.org/dc/elements/1.1/title*^"+weightPrimLabel, 
  "http://www.w3.org/2004/02/skos/core#prefLabel*^"+weightPrimLabel,
  "http://www.w3.org/2000/01/rdf-schema#comment*^"+weightSecLabel, 
  "http://purl.org/dc/terms/description*^"+weightSecLabel,
  "http://purl.org/dc/elements/1.1/description*^"+weightSecLabel,
  "http://www.w3.org/2004/02/skos/core#altLabel*^"+weightSecLabel,
  "vocabulary.*^"+weightVocabularyInfo
  ];
  
  /* dynamic build of the filters using vocab and tag values */
  var filter='[';
  if(vocab!=null) filter= filter+'{"term":{"vocabulary.prefix":"'+vocab+'"}}';
  if(tag!=null){
    if(filter.length>1)filter=filter+',';
    var tagsplit = tag.split(",");
    for(i=0; i<tagsplit.length; i++){
      if(tagsplit.length>0 && i>0) filter=filter+',';
      filter= filter+'{"term":{"tags":"'+tagsplit[i]+'"}}';
    }
  }
  filter=eval('('+filter+"]"+')');
  
  /* The first query is used to get the aggregation max value for occurrencesInDatasets and reusedByDatasets metrics */
  var qAgg = {
		  "size": 1,
		  "fields" : ["uri", "prefixedName", "vocabulary.prefix", "metrics.occurrencesInDatasets", "metrics.reusedByDatasets"],
      "query": (function() {
        if(vocab!=null || tag!=null){ /* case we have a filters to apply */
          return {
              "filtered" : {
                  "query" : (function() {
                    if(queryString && queryString.length>0){
                      return {
                          "multi_match" : {
                              "query" : queryString,
                              "fields" : fieldToSearchOn
                          }
                      }
                    }
                    else{
                      return {
                        "match_all" : {}
                      }
                    }
                  })()
                  ,"filter" : {"bool":{"must":filter}}
              }
          }
        }
        else{ /* if no filter */
          if(queryString && queryString.length>0){
            return {
                    "multi_match" : {
                        "query" : queryString,
                        "fields" : fieldToSearchOn
                    }
                }
          }else{
            return {
              "match_all" : {}
            }
          }
        }
      })(),		 
		  "aggregations" : {
        "max_occurrences" : { "max" : { "field" : "metrics.occurrencesInDatasets" } },
        "max_nbDatasets" : { "max" : { "field" : "metrics.reusedByDatasets" } }
      }
		};
  client.search(indexName, type, qAgg).on('data', function(data) {
    /* get the max values from the aggregations of the previous query */
    var maxOcc = JSON.parse(data).aggregations.max_occurrences.value;
    var maxDatasets = JSON.parse(data).aggregations.max_nbDatasets.value;
    var maxScore = JSON.parse(data).hits.max_score;
    
    /* Define the core of the query */ 
    var qCore = {
        "function_score":{
          "boost_mode": "replace",
          "query" : {"multi_match" : {
              "query" : queryString,
              "fields" : fieldToSearchOn
          }}
          ,"script_score" : {
              "lang" : "groovy",
              "params": {
                 "maxScore": maxScore,
                 "wHitScore": parseFloat(wHitScore),
                 "wOccScore": parseFloat(wOccScore),
                 "wDatScore": parseFloat(wDatScore),
                 "maxOcc": maxOcc,
                 "maxDatasets": maxDatasets
             },
             "script" : "maxOcc>>0 ? ((_score / maxScore) * wHitScore + sqrt( doc['metrics.occurrencesInDatasets'].value / maxOcc) * wOccScore + sqrt(doc['metrics.reusedByDatasets'].value / maxDatasets) * wDatScore) / (wHitScore+wOccScore+wDatScore) :_score"
          }
        }
    }
    
    var qCoreMatchAll = {
        "function_score":{
          "boost_mode": "replace",
          "query" : {"match_all" : {}}
          ,"script_score" : {
              "lang" : "groovy",
              "params": {
                 "maxScore": maxScore,
                 "wHitScore": parseFloat(wHitScore),
                 "wOccScore": parseFloat(wOccScore),
                 "wDatScore": parseFloat(wDatScore),
                 "maxOcc": maxOcc,
                 "maxDatasets": maxDatasets
             },
             "script" : "(maxOcc>>0 && maxDatasets>>0)? ((sqrt( doc['metrics.occurrencesInDatasets'].value / maxOcc) * wOccScore + sqrt(doc['metrics.reusedByDatasets'].value / maxDatasets) * wDatScore) / (wOccScore+wDatScore)): _score"
          }
        }
    }
    
    /* The second query inject the metrics max as parameters in the score function script */
    var q = {
        "from": (page - 1) * page_size,
        "size": page_size,
        "fields" : ["uri", "prefixedName", "vocabulary.prefix", "metrics.occurrencesInDatasets", "metrics.reusedByDatasets"],
        "query": (function() {
          /* In case we have a vocabulary or tag filter, we are using a filtered query */ 
          if(vocab!=null || tag!=null){
            return {
                "filtered" : {
                    "query" : (function() {
                    if(queryString && queryString.length>0){
                      return qCore;
                    }
                    else{
                      return qCoreMatchAll;
                    }
                  })()
                  ,"filter" : {"bool":{"must":filter}}
                }
            }
          }
          else{
            return (function() {
                    if(queryString && queryString.length>0){
                      return qCore;
                    }
                    else{
                      return qCoreMatchAll;
                    }
                  })()
          }
        })(),
        "highlight": {
          "pre_tags" : ["<b>"],
          "post_tags" : ["</b>"],
          "fragment_size" : 50, 
          "number_of_fragments" : 3,
          "fields": [
             {"localName.ngram" : {}},
             {"http*" : {}},
             {"vocabulary.prefix": {}},
             {"vocabulary.http://purl.org/dc/terms/title*": {}},
             {"vocabulary.http://purl.org/dc/terms/description*": {}}
          ]
         },
         "aggregations" : {
                  "types" : {
                      "terms" : {
                          "field" : "_type",
                          "size" : 10
                      }
                  },
                  "vocabs" : {
                      "terms" : {
                          "field" : "vocabulary.prefix",
                          "size" : parseInt(vocab_limit)
                      }
                  },
                  "tags" : {
                      "terms" : {
                          "field" : "tags",
                          "size" : parseInt(tag_limit)
                      }
                  }
              }
      };
    //console.log(JSON.stringify(q));
    /* build and return the result JSON object */
    return client.search(indexName, type, q).on('data', function(data) {
      var hit, parsed, result, x, maxScore, maxOcc;
      parsed = JSON.parse(data).hits;
      
      /* filters are the parameters sent by the client to filter the query results */
      var filters = {};
      if(type != 'null' && type.indexOf(",")<0) filters.type=type; 
      if(vocab != 'null') filters.vocab=vocab;
      if(tag != 'null') filters.tag=tag;
      
      result = {
        total_results: parsed.total,
        page: page,
        page_size: page_size,
        queryString: queryString,
        filters:filters,
        aggregations: JSON.parse(data).aggregations,
        results: (function() {
          var results = [];
          for (var i = 0; i < parsed.hits.length; i++) {
            hit = parsed.hits[i];
            x = hit.fields;
            x.type = hit._type;
            x.score = hit._score;
            x.highlight = hit.highlight;
            results.push(x);
          }
          return results;
        })()
      };
      return callback(null, result);
    }).on('error', function(error) {
      return callback(error, null);
    }).exec();
    }).on('error', function(error) {
      return callback(error, null);
    }).exec();
};

/**
* Execution of a search on vocabularies
*/
function execSearchVocabulary(client, queryString, page_size, page, tag, tag_limit, lang, lang_limit, callback) {
  if(!tag_limit || (!parseInt(tag_limit) && tag_limit!=='0') || parseInt(page_size)<1)tag_limit=10;
  if(!lang_limit || (!parseInt(lang_limit) && lang_limit!=='0') || parseInt(page_size)<1)lang_limit=10;
  var type='vocabulary';
  if(!page_size || (!parseInt(page_size) && page_size!=='0') || parseInt(page_size)<1)page_size=15;
  if(!page || (!parseInt(page) && page!=='0') || parseInt(page)<1)page=1;
  page = parseInt(page, 10) || 1;
  
  /* Weights for each field type in the score function */ 
  var weightLocalName=12;/* the local name of a URI */
  var weightPrimLabel=3;/* primary label includes dcterms:title*/
  var weightSecLabel=1.5;/* secondary label includes dcterms:description*/
  
  /* fields concerned by the query and their corresponding boost */
  var fieldToSearchOn= [
  "prefix.autocomplete^"+weightLocalName,
  "http://purl.org/dc/terms/title*^"+weightPrimLabel, 
  "http://purl.org/dc/terms/description*^"+weightSecLabel
  ];
  
  /* dynamic build of the filters using tag and lang values */
  var filter='[';
  if(tag!=null){
    if(filter.length>1)filter=filter+',';
    var tagsplit = tag.split(",");
    for(i=0; i<tagsplit.length; i++){
      if(tagsplit.length>0 && i>0) filter=filter+',';
      filter= filter+'{"term":{"tags":"'+tagsplit[i]+'"}}';
    }
  }
  if(lang!=null){
    if(filter.length>1)filter=filter+',';
    var langsplit = lang.split(",");
    for(i=0; i<langsplit.length; i++){
      if(langsplit.length>0 && i>0) filter=filter+',';
      filter= filter+'{"term":{"langs":"'+langsplit[i]+'"}}';
    }
  }
  filter=eval('('+filter+"]"+')');
  

    var q = {
        "from": (page - 1) * page_size,
        "size": page_size,
        "query": (function() {
          /* In case we have a vocabulary or tag filter, we are using a filtered query */ 
          if(lang!=null || tag!=null){
            return {
                "filtered" : {
                    "query":(function() {
                    if(queryString && queryString.length>0){
                      return {
                          "multi_match" : {
                              "query" : queryString,
                              "fields" : fieldToSearchOn
                          }
                      }
                    }
                    else{
                      return {
                        "match_all" : {}
                      }
                    }
                  })()                
                    ,"filter" : {"bool":{"must":filter}}
                }
            }
          }
          else{
            return (function() {
                    if(queryString && queryString.length>0){
                      return {
                          "multi_match" : {
                              "query" : queryString,
                              "fields" : fieldToSearchOn
                          }
                      }
                    }
                    else{
                      return {
                        "match_all" : {}
                      }
                    }
                  })()
          }
        })(),
        "sort" : (function() {
                    if(queryString && queryString.length>0){
                      return [{ "_score" : {"order" : "desc"}}]
                    }
                    else{
                      return [{ "prefix" : {"order" : "asc"}}]
                    }
                  })()
        ,"aggregations" : {
                  "tags" : {
                      "terms" : {
                          "field" : "tags",
                          "size" : parseInt(tag_limit)
                      }
                  },
                  "langs" : {
                      "terms" : {
                          "field" : "langs",
                          "size" : parseInt(lang_limit)
                      }
                  }
              }
      };
    //console.log(JSON.stringify(q))
    /* build and return the result JSON object */
    return client.search(indexName, type, q).on('data', function(data) {
      var parsed, result;
      parsed = JSON.parse(data).hits;
      /* filters are the parameters sent by the client to filter the query results */
      var filters = {};
      if(tag != 'null') filters.tag=tag;
      if(lang != 'null') filters.lang=lang;
      
      result = {
        total_results: parsed.total,
        page: page,
        page_size: page_size,
        queryString: queryString,
        filters:filters,
        aggregations: JSON.parse(data).aggregations,
        results: parsed.hits
      };
      return callback(null, result);
    }).on('error', function(error) {
      return callback(error, null);
    }).exec();
};

/**
* Execution of a search on agent
*/
function execSearchAgent(client, queryString, page_size, page, type, tag, tag_limit, callback) {
  if(!tag_limit || (!parseInt(tag_limit) && tag_limit!=='0') || parseInt(page_size)<1)tag_limit=10;
  if(!type)type='person,organization';
  if(!page_size || (!parseInt(page_size) && page_size!=='0') || parseInt(page_size)<1)page_size=15;
  if(!page || (!parseInt(page) && page!=='0') || parseInt(page)<1)page=1;
  page = parseInt(page, 10) || 1;
  
  /* fields concerned by the query and their corresponding boost */
  var fieldToSearchOn= [
  "name.ngram"];
  
  /* dynamic build of the filters using tag values */
  var filter='[';
  if(tag!=null){
    if(filter.length>1)filter=filter+',';
    var tagsplit = tag.split(",");
    for(i=0; i<tagsplit.length; i++){
      if(tagsplit.length>0 && i>0) filter=filter+',';
      filter= filter+'{"term":{"tags.label":"'+tagsplit[i]+'"}}';
    }
  }
  filter=eval('('+filter+"]"+')');
  

    var q = {
        "from": (page - 1) * page_size,
        "size": page_size,
        "query": (function() {
          /* In case we have a vocabulary or tag filter, we are using a filtered query */ 
          if(tag!=null){
            return {
                "filtered" : {
                    "query":(function() {
                    if(queryString && queryString.length>0){
                      return {
                          "multi_match" : {
                              "query" : queryString,
                              "fields" : fieldToSearchOn
                          }
                      }
                    }
                    else{
                      return {
                        "match_all" : {}
                      }
                    }
                  })()                  
                    ,"filter" : {"bool":{"must":filter}}
                }
            }
          }
          else{
            return (function() {
                    if(queryString && queryString.length>0){
                      return {
                          "multi_match" : {
                              "query" : queryString,
                              "fields" : fieldToSearchOn
                          }
                      }
                    }
                    else{
                      return {
                        "match_all" : {}
                      }
                    }
                  })();
          }
        })(),
        "sort" : [{ "name" : {"order" : "asc"}}],
        "aggregations" : {
                  "types" : {
                      "terms" : {
                          "field" : "_type",
                          "size" : 10
                      }
                  },
                  "tags" : {
                      "terms" : {
                          "field" : "tags.label",
                          "size" : parseInt(tag_limit)
                      }
                  }
              }
      };
    //console.log(JSON.stringify(q))
    /* build and return the result JSON object */
    return client.search(indexName, type, q).on('data', function(data) {
      var parsed, result;
      parsed = JSON.parse(data).hits;
      /* filters are the parameters sent by the client to filter the query results */
      var filters = {};
      if(tag != 'null') filters.tag=tag;
      if(type != 'null' && type.indexOf(",")<0) filters.type=type; 
      
      result = {
        total_results: parsed.total,
        page: page,
        page_size: page_size,
        queryString: queryString,
        filters:filters,
        aggregations: JSON.parse(data).aggregations,
        results: parsed.hits
      };
      return callback(null, result);
    }).on('error', function(error) {
      return callback(error, null);
    }).exec();
};

/* return results from autocompletion on terms types */
function execAutocompleteTerms(client, queryString, page_size, page, type, callback) {
  if(!type)type='class,property,instance,datatype';
  if(!page || (!parseInt(page) && page!=='0') || parseInt(page)<1)page=1;
  page = parseInt(page, 10) || 1;
  if(!page_size || (!parseInt(page_size) && page_size!=='0') || parseInt(page_size)<1)page_size=10;
  
  /* issue the autocomplete with the edge-ngram analyzed fields suffixed with .autocomplete */
  var q = {
		  "from": (page - 1) * page_size,
		  "size": page_size,
		  "fields" : ["uri", "prefixedName", "localName"],
		  "query" : {
			 "multi_match" : {
				 "query": queryString,
				 "fields": ["prefixedName.autocomplete","uri.autocomplete"]
			 }
		  }
		};
  return client.search(indexName, type, q).on('data', function(data) {
    var hit, parsed, result, x;
    parsed = JSON.parse(data).hits;
    result = {
      total_results: parsed.total,
      page: page,
	  page_size: page_size,
      results: (function() {
        var results = [];
        for (var i = 0; i < parsed.hits.length; i++) {
          hit = parsed.hits[i];
          x = hit.fields;
          x.type = hit._type;
          x.score = hit._score;
          results.push(x);
        }
        return results;
      })()
    };
    return callback(null, result);
  }).on('error', function(error) {
    return callback(error, null);
  }).exec();
};

/* return results from autocompletion on vocabulary type */
function execAutocompleteVocabularies(client, queryString, page_size, page, callback) {
  if(!page || (!parseInt(page) && page!=='0') || parseInt(page)<1)page=1;
  page = parseInt(page, 10) || 1;
  if(!page_size || (!parseInt(page_size) && page_size!=='0') || parseInt(page_size)<1)page_size=10;
  var q = {
		  "from": (page - 1) * page_size,
		  "size": page_size,
		  "fields" : ["uri", "prefix","http://purl.org/dc/terms/title@en"],
		  "query" : {
			 "multi_match" : {
				 "query": queryString,
				 "fields": ["prefix.autocomplete","uri.autocomplete"]
			 }
		  }
		};
  return client.search(indexName, 'vocabulary', q).on('data', function(data) {
    var hit, parsed, result, x;
    parsed = JSON.parse(data).hits;
    result = {
      total_results: parsed.total,
      page: page,
	  page_size: page_size,
      results: (function() {
        var results = [];
        for (var i = 0; i < parsed.hits.length; i++) {
          hit = parsed.hits[i];
          x = hit.fields;
          x.score = hit._score;
          results.push(x);
        }
        return results;
      })()
    };
    return callback(null, result);
  }).on('error', function(error) {
    return callback(error, null);
  }).exec();
};

/* return suggestions close to the input term */
function execSuggestTerms(client, queryString, suggest_size, type, callback) {
  if(!type)type='class,property,instance,datatype';
  if(!suggest_size || (!parseInt(suggest_size) && suggest_size!=='0') || parseInt(suggest_size)<1)suggest_size=5;
  
  /* issue the suggestion on the rdfs:label@en field */
  var q = {
		  "size":0,
		  "suggest":{
        "termSuggestion" : {
          "text" : queryString,
          "term" : {
            "sort": "frequency",
            "field" : "http://www.w3.org/2000/01/rdf-schema#label@en",
            "suggest_mode": "always"
          }
        }
      }
    };
  return client.search(indexName, type, q).on('data', function(data) {
    var suggestions,result;
    if (JSON.parse(data).suggest && JSON.parse(data).suggest.termSuggestion && JSON.parse(data).suggest.termSuggestion.length>0) suggestions = JSON.parse(data).suggest.termSuggestion[0].options;
    result = {
      suggestions: suggestions
    };
    return callback(null, result);
  }).on('error', function(error) {
    return callback(error, null);
  }).exec();
};

/* return suggestions close to the input term */
function execAutocompleteLabelsTerms(client, queryString, suggest_size, callback) {
  if(!suggest_size || (!parseInt(suggest_size) && suggest_size!=='0') || parseInt(suggest_size)<1)suggest_size=5;
  
  /* issue the suggestion on the rdfs:label@en field */
  var q = { index: 'lov',
    body: {
      "autocomplete" : {
          "text" : queryString,
          "completion" : {
              "field" : "labelsWithoutLang"
          }
      }
    }
  };
  return client.suggest(q, function(err, data) {
    if(err)return callback(error, null);
    var hit, parsed, result, text;
    parsed = data.autocomplete[0];
    console.log(parsed);
    result = {
      suggestions: (function() {
        var results = [];
        for (var i = 0; i < parsed.options.length; i++) {
          text = parsed.options[i].text;
          results.push(text);
        }
        return results;
      })()
    };
    return callback(null, result);
  });
};

/**
* Terms Autocomplete Labels API
*/
exports.apiAutocompleteLabelsTerms = function (req, res, esclient) {
	if (!req.query.q) { //control that q param is present
		return standardBadRequestHandler(req, res, 'Query parameter missing. Syntax: ?q=querytext');
	} else {
		console.log('Autocomplete for terms labels starting with "'+req.query.q+'"')
		var query = { index: 'lov',
    body: {
      "autocomplete" : {
          "text" : req.query.q,
          "completion" : {
              "field" : "labelsWithoutLang"
          }
      }
    }
  };

    esclient.suggest(query).then(function (resp) {
        var results = [];
        res.header('Content-type', 'application/json; charset=utf-8');
        res.json(resp.autocomplete[0].options);
    });
	}
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
    res.header("Content-Type", "application/json; charset=utf-8");
    return res.send(200, results);
  }
};