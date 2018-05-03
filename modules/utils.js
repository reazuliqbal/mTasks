const url = require('url');

module.exports = {
  isAuthenticated: (req, res, next) => {
    if (!req.session.user) {
      res.redirect('/connect');
    }

    return next();
  },

  isAdmin: (req, res, next) => {
    if (!req.session.admin) {
      res.redirect('/connect');
    }

    return next();
  },

  getSiteUrl: req => url.format({
    protocol: req.protocol,
    host: req.get('host'),
  }),
};
