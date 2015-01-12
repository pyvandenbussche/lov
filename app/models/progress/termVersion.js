
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema

/**
 * Getters
 */

var getTags = function (tags) {
  return tags.join(',')
}

/**
 * Setters
 */

var setTags = function (tags) {
  return tags.split(',')
}

/**
 * Article Schema
 */

var VocabularySchema = new Schema({
  uri: {type : String, default : '', trim : true},
  category: {type : String, default : '', trim : true},
  types: [{
    value: {type : String, default : '', trim : true},
  }],
  prefixedName: {type : String, default : '', trim : true},
  localName: {type : String, default : '', trim : true},
  type: [{
    value: {type : String, default : '', trim : true},
    lang: {type : String, default : '', trim : true},
  }],
  vocabularies: [{
    version: { type : Schema.ObjectId, ref : 'VocabularyVersion' },
    issued: { type : Date, default : Date.now }
  }],
  isDefinedBy: {type : Schema.ObjectId, ref : 'Vocabulary' },
  creators: [{ type : Schema.ObjectId, ref : 'Agent' }],
  contributors: [{ type : Schema.ObjectId, ref : 'Agent' }],
  publishers: [{ type : Schema.ObjectId, ref : 'Agent' }],
  triples: [{
    property: { type : String, default : '' },
    value: { type : String, default : '' },
    lang: { type : String, default : '' },
    datatype: { type : String, default : '' }
  }],
  comments: [{
    body: { type : String, default : '' },
    user: { type : Schema.ObjectId, ref : 'User' },
    createdAt: { type : Date, default : Date.now }
  }],
  term: {term: { type : Schema.ObjectId, ref : 'Term' },
})

/**
 * Validations
 */

ArticleSchema.path('title').validate(function (title) {
  return title.length > 0
}, 'Article title cannot be blank')

ArticleSchema.path('body').validate(function (body) {
  return body.length > 0
}, 'Article body cannot be blank')

/**
 * Pre-remove hook
 */

ArticleSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3')
  var files = this.image.files

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err)
  }, 'article')

  next()
})

/**
 * Methods
 */

ArticleSchema.methods = {

  /**
   * Save article and upload image
   *
   * @param {Object} images
   * @param {Function} cb
   * @api private
   */

  uploadAndSave: function (images, cb) {
    if (!images || !images.length) return this.save(cb)

    var imager = new Imager(imagerConfig, 'S3')
    var self = this

    imager.upload(images, function (err, cdnUri, files) {
      if (err) return cb(err)
      if (files.length) {
        self.image = { cdnUri : cdnUri, files : files }
      }
      self.save(cb)
    }, 'article')
  },

  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @param {Function} cb
   * @api private
   */

  addComment: function (user, comment, cb) {
    var notify = require('../mailer/notify')

    this.comments.push({
      body: comment.body,
      user: user._id
    })

    notify.comment({
      article: this,
      currentUser: user,
      comment: comment.body
    })

    this.save(cb)
  }

}

/**
 * Statics
 */

ArticleSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb)
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .populate('user', 'name username')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb)
  }

}

mongoose.model('Article', ArticleSchema)
