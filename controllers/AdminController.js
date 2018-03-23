const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Order = require('../models/Order');
const steemconnect = require('../modules/steemconnect');

module.exports = {
    getIndex: async (req, res, next) => {
        let users_count = await User.find({}).count();
        let services_count = await Service.find({ }).count();
        let orders_count = await Order.find({ completed: true }).count();
        let categories = await Category.aggregate([
            { $lookup: { from: 'services', localField: '_id', foreignField: 'category', as: 'service' }},
            { $group: { _id: '$_id', "data": {"$first":"$$ROOT"} , count: { $sum: { $size: "$service" }}}},
            { $project: { name: "$data.name", slug: "$data.slug", service_count: "$count"} }
         ]);
        
        let recentOrders = await Order.find({ agent_approved: false, completed: false }).populate('buyer', 'username').populate('seller', 'username').populate('service', 'title price slug');
        res.render('admin/index', {
            title: 'Admin Panel',
            recentOrders: recentOrders,
            data: {
                orders_count: orders_count,
                users_count: users_count,
                services_count: services_count
            },
            categories: categories
        });
    },

    getLogout: (req, res, next) => {
        if (req.session) {
            req.session = null;
            return res.redirect('/');
        }
    },

    getAddCategory: async (req, res, next) => {
        var categories = await Category.find({});
        res.render('admin/add-category', { title: 'Add Category', categories: categories });
    },

    postAddCategory: (req, res, next) => {
        Joi.validate(req.body, JoiSchema.Category, (err, value) => {
            if(!err) {
                var category = new Category({
                        name: value.name,
                        slug: slugify(value.name, { lower: true }),
                        image: value.image,
                        description: value.description
                    });
                category.save(function (err, results) {
                    if(!err) {
                        res.redirect('/dashboard/add-category');
                    }
                });
            } else {
                console.log(err);
            }
        });
    }
}