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



exports.list = function (req, res) {
  res.render('vocabVersions/edit', {
    vocab: req.vocab,
    profile:req.user,
    utils: utils
  });
}

exports.remove = function (req, res) {
  var versionIssued = Date.parse(req.body.issued);
  var versionName = req.body.name;
  var vocab = req.vocab;
  vocab.lastModifiedInLOVAt = new Date();
  
  //remove the selected version
  var versionFile;
  for (i = 0; i < vocab.versions.length; i++) { 
    var version = vocab.versions[i];
    //console.log(version.issued+' - '+req.body.issued+' - '+(Date.parse(version.issued) === versionIssued));
    //console.log(version.name+' - '+versionName+' - '+(version.name === versionName));
    if(Date.parse(version.issued) === versionIssued && version.name === versionName){
      //console.log(vocab.versions.length);
      if(version.fileURL){
        var versionIssuedDate = new Date(version.issued);
        var d = versionIssuedDate.getDate();
        var m = versionIssuedDate.getMonth() + 1;
        var y = versionIssuedDate.getFullYear();
        var dateStr = '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
        versionFile = './versions/'+vocab._id+'/' +vocab._id+'_'+ dateStr+'.n3'
      }
      vocab.versions.splice(i,1);
      //console.log(vocab.versions.length);
      break
    }
    //console.log(vocab.versions.length);
  }
  
  vocab.save(function(err) {
    if (err) {return res.render('500')}
    
    // if the version has a file attached, then delete it
    if(versionFile){
      fs.unlink(versionFile, function() {
          if (err) throw err;
          return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
      });
    }
    else{
      return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
    }
  })
}

exports.changeStatusReviewed = function (req, res) {
  var versionIssued = Date.parse(req.body.issued);
  var versionName = req.body.name;
  var vocab = req.vocab;
  vocab.lastModifiedInLOVAt = new Date();
  
  //change the status of the selected version
  for (i = 0; i < vocab.versions.length; i++) { 
    var version = vocab.versions[i];
    if(Date.parse(version.issued) === versionIssued && version.name === versionName){
      vocab.versions[i].isReviewed = true;
      break
    }
  }
  
  vocab.save(function(err) {
    if (err) {return res.render('500')}
    return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
  })
}

exports.changeStatusReviewedAll = function (req, res) {
  var vocab = req.vocab;
  vocab.lastModifiedInLOVAt = new Date();
  
  //change the status of all versions
  for (i = 0; i < vocab.versions.length; i++) {
    vocab.versions[i].isReviewed = true;
  }  
  vocab.save(function(err) {
    if (err) {return res.render('500')}
    return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
  })
}

exports.edit = function (req, res) {
  var versionIssued = Date.parse(req.body.issued);
  var versionName = req.body.name;
  var versionIssuedNew = Date.parse(req.body.issuedNew);
  var versionNameNew = req.body.nameNew;
  var vocab = req.vocab;
  vocab.lastModifiedInLOVAt = new Date();
  //console.log(versionIssued+" - "+versionName);
  //console.log(versionIssuedNew+" - "+versionNameNew);
  
  var versionIssuedDate = new Date(versionIssued);
    var ds = versionIssuedDate.getDate();
    var ms = versionIssuedDate.getMonth() + 1;
    var ys = versionIssuedDate.getFullYear();
    var sourceDateStr = '' + ys + '-' + (ms<=9 ? '0' + ms : ms) + '-' + (ds <= 9 ? '0' + ds : ds);
    var versionIssuedNewDate = new Date(versionIssuedNew);
    var d = versionIssuedNewDate.getDate();
    var m = versionIssuedNewDate.getMonth() + 1;
    var y = versionIssuedNewDate.getFullYear();
    var targetDateStr = '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
  
  //change the date and issued date of the selected version
  for (i = 0; i < vocab.versions.length; i++) { 
    var version = vocab.versions[i];
    //console.log(Date.parse(version.issued)+" - "+version.name);
    if(Date.parse(version.issued) === versionIssued && version.name === versionName){
      vocab.versions[i].isReviewed = true;
      vocab.versions[i].issued = versionIssuedNew;
      vocab.versions[i].name = versionNameNew;
      if(vocab.versions[i].fileURL) vocab.versions[i].fileURL = "http://lov.okfn.org/dataset/lov/vocabs/"+vocab.prefix+"/versions/"+targetDateStr+".n3";
      break
    }
  }  
  vocab.save(function(err) {
    if (err) {return res.render('500')}
    //change version file name if date has changed
    if(sourceDateStr === targetDateStr){
      return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
    }
    else{
      var source_path = './versions/'+vocab._id+'/' +vocab._id+'_'+ sourceDateStr+'.n3'
      var target_path = './versions/'+vocab._id+'/' +vocab._id+'_'+ targetDateStr+'.n3'
      fs.rename(source_path, target_path, function(err) {
            if (err) throw err;
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
            fs.unlink(source_path, function() {
                if (err) throw err;
                return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
            });
      });
    }
  })
}
  
exports.new = function (req, res) {
  var version = {};
  var versionName = req.body.name;
  var versionIssued = new Date(req.body.issued);
  
  var vocab = req.vocab;
  vocab.lastModifiedInLOVAt = new Date();
  //console.log(versionIssued+" - "+versionName);
  version.issued = versionIssued;
  version.name = versionName;
  version.isReviewed = true;
  
  var d = versionIssued.getDate();
  var m = versionIssued.getMonth() + 1;
  var y = versionIssued.getFullYear();
  var issuedStr = '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
  
  //console.log(req.files);
  //console.log(vocab);
  
  if(req.files && req.files.file && req.files.file.size>0){//version file attached
    //upload file if present
    //http://www.hacksparrow.com/handle-file-uploads-in-express-node-js.html
    // get the temporary location of the file
      var tmp_path = req.files.file.path;
      // make sure the destination foler exists
      if (!fs.existsSync('./versions/'+vocab._id))fs.mkdirSync('./versions/'+vocab._id);
      // set where the file should actually exists - in this case it is in the "images" directory
      var target_path = './versions/'+vocab._id+'/' +vocab._id+'_'+ issuedStr+'.n3' //req.files.file.name;
      // move the file from the temporary location to the intended location
      fs.rename(tmp_path, target_path, function(err) {
          if (err) throw err;
          // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
          fs.unlink(tmp_path, function() {
              if (err) throw err;
              var versionPublicPath = "http://lov.okfn.org/dataset/lov/vocabs/"+req.vocab.prefix+"/versions/"+issuedStr+".n3";
              //analyse the vocab
               var command = "/usr/local/lov/scripts/bin/versionAnalyser "+versionPublicPath+" "+req.vocab.uri+" "+req.vocab.nsp+" /usr/local/lov/scripts/lov.config";
              var exec = require('child_process').exec;
              child = exec(command,
                function (error, stdout, stderr) {
                  if(error !== null){
                    console.log('exec error: ' + error);
                  }
                  stdout = JSON.parse(stdout);
                  stdout = _.extend(stdout, version);
                   Vocabulary.addVersion(vocab.prefix, stdout, function(err) {
                      if (err) {return res.render('500')}
                      return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
                    });
              });
          });
      });    
  }
  else{//no version file atached
    Vocabulary.addVersion(vocab.prefix, version, function(err) {
      if (err) {return res.render('500')}
      return res.redirect('/edition/lov/vocabs/'+vocab.prefix+'/versions')
    });
  }
  
}