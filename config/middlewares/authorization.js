/*
* Shall I switch to https://github.com/ForbesLindesay/connect-roles ?
*/

/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl
    return res.redirect('edition/lov/login')
  }
  next()
}

exports.requiresAdmin = function (req, res, next) {
  if (req.isAuthenticated() && req.user.category === "admin") {
    next()
  }
  else{
    req.session.returnTo = req.originalUrl
    return res.redirect('edition/lov/login')
  }
}
exports.requiresAdminOrUser = function (req, res, next) {
  if (req.isAuthenticated() && (req.user.category === "admin" || ''+req.userObj._id === ''+req.user.id)) {
    next()
  }
  else{
    req.session.returnTo = req.originalUrl
    return res.redirect('edition/lov/login')
  }
}



/*
 *  User authorization routing middleware
 */

exports.user = {
  hasAuthorization : function (req, res, next) {
    if (req.profile.id != req.user.id) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/users/'+req.profile.id)
    }
    next()
  }
}

/*
 *  Article authorization routing middleware
 */

exports.article = {
  hasAuthorization : function (req, res, next) {
    if (req.article.user.id != req.user.id) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/articles/'+req.article.id)
    }
    next()
  }
}

exports.agent = {
  hasAuthorization : function (req, res, next) {
    if (req.agent.id == req.user.id || req.user.category == "admin") { // need to change this for security issues
      next()
    }
    else{
      req.flash('info', 'You are not authorized')
      return res.redirect('/agents/'+req.agent.id)
    }
  }
}
