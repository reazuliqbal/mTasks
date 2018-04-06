const Remarkable = require('remarkable');
const dateFormat = require('dateformat');
const steem = require('../modules/steem');
const steemconnect = require('../modules/steemconnect');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');

const md = new Remarkable();

module.exports = {
  getIndex: async (req, res) => {
    const categories = await Category.find({});
    Service.find({})
      .sort({ date: -1 })
      .limit(20)
      .populate('category')
      .populate('seller', 'username')
      .exec((err, services) => {
        res.render('home', { title: 'mTasks', services, categories });
      });
  },

  getConnect: (req, res) => {
    if (req.session.user) {
      res.redirect('/dashboard');
    } else if (req.session.admin) {
      res.redirect('/admin');
    }

    if (!req.query.access_token) {
      const uri = steemconnect.getLoginURL();
      res.redirect(uri);
    } else {
      steemconnect.setAccessToken(req.query.access_token);
      steemconnect.me((err, steemResponse) => {
        req.session.user = {
          name: steemResponse.account.name,
          access_token: req.query.access_token,
        };
        User.findOne({ username: steemResponse.account.name }, (err, user) => {
          if (!user.admin) {
            req.session.user._id = user._id;

            res.redirect('/dashboard');
          } else if (user.admin) {
            req.session.user = null;

            req.session.admin = {
              _id: user._id,
              name: steemResponse.account.name,
              access_token: req.query.access_token,
            };

            res.redirect('/admin');
          } else {
            res.redirect('/register');
          }
        });
      });
    }
  },

  getLogout: (req, res) => {
    if (req.session) {
      req.session.destroy();
      res.redirect('/');
    }
  },

  getRegister: (req, res) => {
    res.render('register', { title: 'Register', name: req.session.user.name });
  },

  postRegister: (req, res) => {
    const user = new User();
    user.name = req.body.name;
    user.username = req.body.username;
    user.email = req.body.email;

    user.save((err) => {
      if (err) {
        console.log(err);
      } else {
        req.session.user._id = user._id;
        res.redirect('/dashboard');
      }
    });
  },

  getProfile: (req, res, next) => {
    User.findOne({ username: req.params.username }).populate('services').exec((err, user) => {
      if (err) {
        console.log(err);
      } else if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        next(error);
      } else {
        steem.api.getAccounts([user.username], (err, result) => {
          if (!err) {
            let jsonMetadata = result[0].json_metadata;
            let profileImage = '';
            if (jsonMetadata === '') {
              jsonMetadata = '{ "profile": { "profile_image": "" } }';
            }
            jsonMetadata = JSON.parse(jsonMetadata);

            if (jsonMetadata.profile.profile_image) {
              profileImage = jsonMetadata.profile.profile_image;
            } else {
              profileImage = `https://robohash.org/${user.username}.png?size=120x120`;
            }

            res.render('profile', {
              title: (user.name) ? user.name : `Profile of @${user.username}`,
              user,
              steem: {
                created: dateFormat(result[0].created, 'dddd, mmmm dS, yyyy, h:MM:ss TT'),
                voting_power: result[0].voting_power,
                reputation: steem.formatter.reputation(result[0].reputation),
                profileImage,
              },
            });
          } else {
            console.log(err);
          }
        });
      }
    });
  },

  getContent: async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    Service.findOne({ slug: req.params.slug, seller: user._id }).populate('seller', 'username').populate('category').exec((err, service) => {
      if (err) {
        console.log(err);
      } else if (service) {
        steem.api.getContent(service.seller.username, req.params.slug, (err, content) => {
          res.render('service', {
            title: service.title,
            service,
            content: {
              url: content.url,
              body: md.render(content.body),
              created: dateFormat(content.created, 'mmmm dS, yyyy'),
              author_reputation: steem.formatter.reputation(content.author_reputation),
              json_metadata: JSON.parse(content.json_metadata),
            },
          });
        });
      } else {
        console.log('Not found');
      }
    });
  },
};
