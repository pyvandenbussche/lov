
/**
 * Formats mongoose errors into proper array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

exports.errors = function (errors) {
  var keys = Object.keys(errors)
  var errs = []

  // if there is no validation error, just display a generic error
  if (!keys) {
    console.log(errors);
    return ['Oops! There was an error']
  }

  keys.forEach(function (key) {
    errs.push(errors[key].message)
  })

  return errs
}

/**
 * Index of object within an array
 *
 * @param {Array} arr
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.indexof = function (arr, obj) {
  var index = -1; // not found initially
  var keys = Object.keys(obj);
  // filter the collection with the given criterias
  var result = arr.filter(function (doc, idx) {
    // keep a counter of matched key/value pairs
    var matched = 0;

    // loop over criteria
    for (var i = keys.length - 1; i >= 0; i--) {
      if (doc[keys[i]] === obj[keys[i]]) {
        matched++;

        // check if all the criterias are matched
        if (matched === keys.length) {
          index = idx;
          return idx;
        }
      }
    };
  });
  return index;
}

/**
 * Find object in an array of objects that matches a condition
 *
 * @param {Array} arr
 * @param {Object} obj
 * @param {Function} cb - optional
 * @return {Object}
 * @api public
 */

exports.findByParam = function (arr, obj, cb) {
  var index = exports.indexof(arr, obj)
  if (~index && typeof cb === 'function') {
    return cb(undefined, arr[index])
  } else if (~index && !cb) {
    return arr[index]
  } else if (!~index && typeof cb === 'function') {
    return cb('not found')
  }
  // else undefined is returned
}

exports.dateToYMD  = function (date) {
    if(!date)return date;
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

exports.msToTime = function (duration) {
    /*var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return seconds + "." + milliseconds +" ms";*/
    var rx=  /(\d+)(\d{3})/;
    return String(duration).replace(/^\d+/, function(w){
        while(rx.test(w)){
            w= w.replace(rx, '$1.$2');
        }
        return w;
    });
}

exports.valueLangDisplay  = function (object, valueKeyName, hrefKeyName, hrefPrefix) {
    var html='';
    if(object){
      for (i = 0; i < object.length; i++){
        var part = object[i];
        if(html.length>0) html+=', ';
        if(hrefKeyName && hrefKeyName.length>0)html+='<span><a href=\''+hrefPrefix+part[hrefKeyName]+'\'>'+part[valueKeyName]+'</a></span>';
        else html+='<span>'+part[valueKeyName]+'</span>';
        if(part.lang && part.lang.length>0) html+='<span class="lang"> @'+part.lang+'</span>';
      }
    }
    return html;
}

exports.agentSuggest  = function (object) {
    var html='';
    for (i = 0; i < object.length; i++){
      var part = object[i];
      if(html.length>0) html+=', ';
      html+='<span><a href=\''+part['prefUri']+'\'>';
      if(part['name'])html+=part['name'];
      else html+=part['prefUri'];
      html+='</a></span>';
    }
    return html;
}

exports.relationSuggest  = function (object) {
    var html='';
    for (i = 0; i < object.length; i++){
      var part = object[i];
      html+='<div><span>'+part['uri']+' </span>';
      if(part['prefix'])html+='<a href=\'/dataset/lov/vocabs/'+part['prefix']+'\'>('+part['prefix']+')</a>';
      html+='</div>';
    }
    return html;
}

exports.displayReviews  = function (comment) {
//console.log(comment);

    var html='';
    for (i = 0; i < comment.length; i++){
      var part = comment[i];
      html+='<div>('+this.dateToYMD(part.createdAt)+')</span> <a href="/dataset/lov/agents/'+part.agentId["name"]+'">'+part.agentId.name+'</a>: <span>'+part.body+'</div>';
    }
    return html;
}

exports.prefixMe = function(uri) {
  uri = uri.replace("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:");
  uri = uri.replace("http://www.w3.org/2000/01/rdf-schema#","rdfs:");
  uri = uri.replace("http://www.w3.org/2002/07/owl#","owl:");
  uri = uri.replace("http://purl.org/dc/elements/1.1/","dce:");
  uri = uri.replace("http://purl.org/dc/terms/","dcterms:");
  uri = uri.replace("http://www.w3.org/2004/02/skos/core#","skos:");
  return uri;
}

exports.findVocabByURINsp = function(arr, propValue) {
  for (var i=0; i < arr.length; i++)
    if (arr[i]["uri"] == propValue|| arr[i]["nsp"] == propValue)
      return arr[i];
  // will return undefined if not found; you could return a default instead
}

exports.findVocab = function(arr, propName, propValue) {
  for (var i=0; i < arr.length; i++)
    if (arr[i][propName] == propValue)
      return arr[i];
  // will return undefined if not found; you could return a default instead
}

exports.getColor20 = function(index){
  //colors from d3.scale.category20() https://github.com/mbostock/d3/wiki/Ordinal-Scales
  var color=["#1f77b4","#aec7e8","#ff7f0e","#ffbb78","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5","#8c564b","#c49c94","#e377c2","#f7b6d2","#7f7f7f","#c7c7c7","#bcbd22","#dbdb8d","#17becf","#9edae5"];
  return color[index];
}

exports.getUnmatchedRel = function(relArray){
  var unmatched = [];
  if(relArray){
    for (var i=0; i < relArray.length; i++){
      if(!relArray[i].prefix)unmatched.push({uri:relArray[i].uri})
    }
  }
  return unmatched;
}