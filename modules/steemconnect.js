const steemconnect2 = require('sc2-sdk');
const config = require('../config');

const steemconnect = steemconnect2.Initialize({
  app: config.auth.client_id,
  callbackURL: config.auth.redirect_uri,
  scope: ['login', 'comment', 'offline'],
});

module.exports = steemconnect;
