const slugify = require('slugify');
const steem = require('steem');
const config = require('../config');
const steemconnect = require('../modules/steemconnect');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Order = require('../models/Order');

module.exports = {
    getDashboard: async (req, res, next) => {
        let services = await Service.find({ seller: req.session.user._id }).populate('category').populate('seller', 'username');
        let orders = await Order.find({ buyer: req.session.user._id }).populate('seller', 'username').populate('service', 'title price slug');
        res.render('dashboard', { title: 'Dashboard', services: services, orders: orders });
    },

    getServiceAdd: (req, res, next) => {
        Category.find({}, function(err, categories) {

            if(err) {
                console.error(err);
            } else {
                res.render('add', { title: 'Add Service', categories: categories });
            }
        });
    },

    postServiceAdd: async (req, res, next) => {
        var title       = req.body.title,
            category    = req.body.category,
            cover       = req.body.cover,
            description = req.body.description,
            price       = req.body.price,
            currency    = req.body.currency,
            tags        = req.body.tags.split(', ');

        tags.unshift(config.site.category);

        var slug = slugify(title, { lower: true });
        var body = `![${title}](${cover}) \n\n ${description} \n\n **Price:** ${price} ${currency} \n\n **Category:** ${category}`;
        var category_slug = slugify(category, {lower: true });
        var jsonMetadata = {
            tags: tags,
            category: category_slug,
            price: price+ ' ' + currency,
            cover_image: cover,
            description: description,
            app: config.site.app_name
        };


        var category = await Category.findOne({ slug: category_slug });
        var user = await User.findOne({ username: req.session.user.name });

        var service = new Service();
        service.title = title;
        service.slug = slug;
        service.price = price+ ' ' + currency;
        service.category = category;
        service.seller = user;

        steemconnect.setAccessToken(req.session.user.access_token);
        steemconnect.comment(
            '',
            config.site.category,
            req.session.user.name,
            slug,
            title,
            body,
            jsonMetadata,
        async (err, result) => {
            if (!err) {
                await service.save( (err) => {
                    user.services.push(service);
                    user.save();
                    res.redirect('/dashboard');
                });
            } else {
                console.log(err);
            }
        });
    },

    getSettings: (req, res, next) => {
        res.send('Will be added later.');
    },

    postSettings: (req, res, next) => {
        res.send('Will be added later.');
    }
};