const Remarkable = require('remarkable');
const md = new Remarkable();
const dateFormat = require('dateformat');
const steem = require('../modules/steem');
const steemconnect = require('../modules/steemconnect');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');

module.exports = {
    getIndex: async (req, res, next) => {
        var categories = await Category.find({});
        Service.find({})
            .sort({'date': -1})
            .limit(20)
            .populate('category')
            .populate('seller', 'username')
            .exec(function(err, services) {
                res.render('home', { title: 'mTasks', services: services, categories: categories });
            });
    },

    getConnect: (req, res, next) => {
        
        if( req.session.user ) {
            res.redirect('/dashboard');
        } else if (req.session.admin) {
            res.redirect('/admin');
        }

        if ( !req.query.access_token ) {
            let uri = steemconnect.getLoginURL();
            res.redirect(uri);
        } else {
            steemconnect.setAccessToken(req.query.access_token);
            steemconnect.me((err, steemResponse) => {
                req.session.user = {
                    name: steemResponse.account.name,
                    access_token: req.query.access_token
                };
                User.findOne({ username: steemResponse.account.name}, function(err, user) {
                    if(!user.admin) {
                        req.session.user._id = user._id;

                        res.redirect('/dashboard');
                    } else if(user.admin) {
                        req.session.user = null;

                        req.session.admin = {
                            _id: user._id,
                            name: steemResponse.account.name,
                            access_token: req.query.access_token
                        }

                        res.redirect('/admin');
                    } else {
                        res.redirect('/register');
                    }
                });
            });
        }
    },

    getLogout: (req, res, next) => {
        if (req.session) {
            req.session = null;
            return res.redirect('/');
        }
    },
    
    getRegister: (req, res, next) => {
        res.render('register', { title: 'Register', name: req.session.user.name });
    },

    postRegister: (req, res, next) => {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.email = req.body.email;

        user.save(function(err) {
            if(err) {
                console.log(err);
            } else {
                req.session.user._id = user._id;
                res.redirect('/dashboard');
            }
        });
    },

    getProfile: (req, res, next) => {
        User.findOne({ username: req.params.username }).populate('services').exec( (err, user) => {
            if(err) {
                console.log(err);
            } else {
                if (!user) {
                    var err = new Error('User not found');
                    err.status = 404;
                    next(err);
                } else {
                    steem.api.getAccounts([user.username], function(err, result) {
                        var json_metadata = "";
                        if(result[0].json_metadata != '') {
                            json_metadata = result[0].json_metadata
                        } else {
                            json_metadata = "{ \"profile\": { \"profile_image\": \"https://robohash.org/noimage.png?size=120x120\" } }";
                        }
                        res.render('profile', {
                            title: (user.name) ? user.name : `Profile of @${user.username}`,
                            user: user,
                            steem: {
                                created: dateFormat(result[0].created, "dddd, mmmm dS, yyyy, h:MM:ss TT"),
                                voting_power: result[0].voting_power,
                                reputation: steem.formatter.reputation(result[0].reputation),
                                json_metadata: JSON.parse(json_metadata)
                            }
                        });
                    });
                }
            }
        });
    },

    getContent: async (req, res, next) => {
        var user = await User.findOne({ username: req.params.username });
        Service.findOne({ slug: req.params.slug, seller: user._id }).populate('seller', 'username').populate('category').exec((err, service) => {
            if(err) {
                console.log(err);
            } else if (service) {
                steem.api.getContent(service.seller.username, req.params.slug, (err, content) => {
                    res.render('service', {
                        title: service.title,
                        service: service,
                        content: {
                            url: content.url,
                            body: md.render(content.body),
                            created: dateFormat(content.created, "mmmm dS, yyyy"),
                            author_reputation: steem.formatter.reputation(content.author_reputation),
                            json_metadata: JSON.parse(content.json_metadata)
                        }
                    });
                });
            } else {
                console.log('Not found');
            }
        });
    }
};
