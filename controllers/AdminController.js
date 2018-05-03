const slugify = require('slugify');
const Joi = require('joi');
const { forEach } = require('p-iteration');
const config = require('../config');
const steem = require('../modules/steem');
const steemconnect = require('../modules/steemconnect');
const { getSiteUrl } = require('../modules/utils');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Order = require('../models/Order');
const JoiSchema = require('../modules/joiSchemas');

module.exports = {
  getIndex: async (req, res) => {
    const usersCount = await User.find({}).count();
    const servicesCount = await Service.find({ }).count();
    const ordersCount = await Order.find({ completed: true }).count();
    const users = await User.find().sort({ createdAt: -1 }).limit(10);
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'services', localField: '_id', foreignField: 'category', as: 'service',
        },
      },
      {
        $group: {
          _id: '$_id', data: { $first: '$$ROOT' }, count: { $sum: { $size: '$service' } },
        },
      },
      {
        $project: { name: '$data.name', slug: '$data.slug', service_count: '$count' },
      },
    ]);

    const recentOrders = await Order.find({ agent_approved: false, completed: false })
      .sort({ createdAt: -1 })
      .populate('buyer', 'username').populate('seller', 'username')
      .populate('service', 'title price currency slug');

    forEach(recentOrders, (order) => {
      steem.api.getEscrow(order.buyer.username, order.escrow_id, async (err, result) => {
        if (result !== null && typeof result === 'object') {
          result.escrow_active = true;
          await Order.updateOrder(order._id, result);
        } else {
          Order.findById(order._id, () => {
            order.escrow_active = false;
            order.save();
          });
        }
      });
    });

    res.render('admin/index', {
      title: 'Admin Panel',
      recentOrders,
      data: {
        ordersCount,
        usersCount,
        servicesCount,
      },
      categories,
      users,
    });
  },

  getLogout: (req, res) => {
    if (req.session) {
      req.session.destroy();
      res.redirect('/');
    }
  },

  getManageCategory: async (req, res) => {
    const categories = await Category.find({});
    let category = {};
    if (req.params.id) {
      category = await Category.findOne({ _id: req.params.id });
    }

    res.render('admin/categories', { title: 'Categories', categories, category });
  },

  postManageCategory: (req, res) => {
    if (req.body.id) {
      Joi.validate(req.body, JoiSchema.EditCategory, (err, value) => {
        if (!err) {
          Category.findById(value.id, (err, category) => {
            if (!err) {
              category.name = value.name;
              category.slug = slugify(value.name, { remove: /[$*_+~.()'"!\-:@]/g, lower: true });
              category.image = value.image;
              category.description = value.description;

              category.save((err) => {
                if (!err) {
                  req.flash('success', 'Category has been updated!', false);
                  res.redirect('/admin/categories');
                }
              });
            }
          });
        }
      });
    } else {
      Joi.validate(req.body, JoiSchema.AddCategory, (err, value) => {
        if (!err) {
          const category = new Category({
            name: value.name,
            slug: slugify(value.name, { remove: /[$*_+~.()'"!\-:@]/g, lower: true }),
            image: value.image,
            description: value.description,
          });
          category.save((error) => {
            if (!error) {
              req.flash('success', 'Category has been added!', false);
              res.redirect('/admin/categories');
            }
          });
        } else {
          console.log(err);
        }
      });
    }
  },

  getUsers: (req, res, next) => {
    const perPage = 20;
    const page = req.params.page || 1;

    User.find({}).skip((perPage * page) - perPage).limit(perPage).sort({ createdAt: -1 })
      .exec((err, users) => {
        User.count().exec((err, count) => {
          if (err) {
            next(err);
          }
          res.render('admin/users', {
            title: 'All Users',
            users,
            count,
            current: page,
            pages: Math.ceil(count / perPage),
          });
        });
      });
  },

  getManageOrders: (req, res) => {
    const perPage = 20;
    const page = req.params.page || 1;
    const query = {};
    if (req.params.type === 'approved') {
      query.agent_approved = true;
    } else if (req.params.type === 'new') {
      query.agent_approved = false;
    } else if (req.params.type === 'disputed') {
      query.disputed = true;
    } else if (req.params.type === 'completed') {
      query.completed = true;
    }

    Order.find(query).skip((perPage * page) - perPage).limit(perPage).sort({ createdAt: -1 })
      .populate('buyer', 'username')
      .populate('seller', 'username')
      .populate('service', 'title price currency slug')
      .exec((err, orders) => {
        forEach(orders, (order) => {
          steem.api.getEscrow(order.buyer.username, order.escrow_id, async (err, result) => {
            if (result !== null && typeof result === 'object') {
              result.escrow_active = true;
              await Order.updateOrder(order._id, result);
            } else {
              Order.findById(order._id, () => {
                order.escrow_active = false;
                order.save();
              });
            }
          });
        });

        Order.find(query).count().exec((err, count) => {
          if (err) {
            console.log(err);
          }
          res.render('admin/orders', {
            title: 'Manage Orders',
            orders,
            count,
            current: page,
            pages: Math.ceil(count / perPage),
            req,
          });
        });
      });
  },
  postManageOrders: async (req, res) => {
    const {
      orderId,
      action,
      receiver,
      sbdAmount,
      steemAmount,
    } = req.body;

    const order = await Order.findById({ _id: orderId }).populate('seller', 'username').populate('buyer', 'username');
    switch (action) {
      case 'approve': {
        const returnURL = `${getSiteUrl(req)}/admin/manage-orders/new`;

        const hotSignLink = steemconnect.sign('escrow_approve', {
          from: order.buyer.username,
          to: order.seller.username,
          agent: config.site.agent_account,
          who: config.site.agent_account,
          escrow_id: order.escrow_id,
          approve: 1,
        }, returnURL);

        res.redirect(hotSignLink);
      }
        break;

      case 'decline': {
        const returnURL = `${getSiteUrl(req)}/admin/manage-orders/new`;

        const hotSignLink = steemconnect.sign('escrow_approve', {
          from: order.buyer.username,
          to: order.seller.username,
          agent: config.site.agent_account,
          who: config.site.agent_account,
          escrow_id: order.escrow_id,
          approve: 0,
        }, returnURL);

        res.redirect(hotSignLink);
      }
        break;

      case 'release': {
        const returnURL = `${getSiteUrl(req)}/admin/manage-orders/disputed`;

        const hotSignLink = steemconnect.sign('escrow_release', {
          from: order.buyer.username,
          to: order.seller.username,
          agent: config.site.agent_account,
          who: config.site.agent_account,
          receiver,
          escrow_id: order.escrow_id,
          sbdAmount,
          steemAmount,
        }, returnURL);

        res.redirect(hotSignLink);
      }
        break;

      default:

        break;
    }
  },
};
