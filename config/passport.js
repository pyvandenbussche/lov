var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , User = mongoose.model('User')


module.exports = function (passport, config) {
  // require('./initializer')

  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id }, function (err, user) {
      done(err, user)
    })
  })
  
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback : true
    },
    function(req, email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) { return done(err) }
        if (!user) {
          return done(null, false, { message: 'Invalid email or password.' })
        }
        if (!user.authenticate(password)) {
          return done(null, false, { message: 'Invalid email or password.' })
        }
        if (!user.activated === true) {
          return done(null, false, { message: 'Your user account has not been activated yet.' })
        }
        return done(null, user)
      })
    }
  ))

  // use local strategy
  /*passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) { return done(err) }
        if (!user) {
          return done(null, false, { message: 'Unknown user' })
        }
        if (!user.authenticate(password)) {
          return done(null, false, { message: 'Invalid password' })
        }
        if (!user.activated === true) {
          return done(null, false, { message: 'Your user account has not been activated yet' })
        }
        return done(null, user)
      })
    }
  ))*/
}
