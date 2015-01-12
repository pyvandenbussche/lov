var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , AgentPrivate = mongoose.model('AgentPrivate')


module.exports = function (passport, config) {
  // require('./initializer')

  // serialize sessions
  passport.serializeUser(function(agent, done) {
    done(null, agent.id)
  })

  passport.deserializeUser(function(id, done) {
    AgentPrivate.findOne({ _id: id }, function (err, agent) {
      done(err, agent)
    })
  })

  // use local strategy
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      AgentPrivate.findOne({ email: email }, function (err, agent) {
        if (err) { return done(err) }
        if (!agent) {
          return done(null, false, { message: 'Unknown user' })
        }
        if (!agent.authenticate(password)) {
          return done(null, false, { message: 'Invalid password' })
        }
        return done(null, agent)
      })
    }
  ))
}
