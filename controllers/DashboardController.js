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
  getDashboard: async (req, res) => {
    const services = await Service.find({ seller: req.session.user._id }).populate('category').populate('seller', 'username');
    const ordersCompleted = await Order.ordersCompleted(req.session.user._id);
    const totalEarned = await Order.totalEarned(req.session.user._id);
    const pendingEarnings = await Order.pendingEarnings(req.session.user._id);

    const placedOrders = await Order.getOrders(req.session.user._id, 'placed');

    const receivedOrders = await Order.getOrders(req.session.user._id, 'received');

    forEach(receivedOrders, (order) => {
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

    forEach(placedOrders, (order) => {
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

    res.render('dashboard/dashboard', {
      title: 'Dashboard',
      services,
      placedOrders,
      receivedOrders,
      totalEarned,
      pendingEarnings,
      ordersCompleted,
    });
  },

  getAddService: (req, res) => {
    Category.find({}, (err, categories) => {
      if (err) {
        console.error(err);
      } else {
        res.render('dashboard/add', { title: 'Add Service', categories });
      }
    });
  },

  postAddService: async (req, res) => {
    Joi.validate(req.body, JoiSchema.AddService, async (err, value) => {
      if (!err) {
        const {
          title, category, cover, description, requirements, price, currency,
        } = value;

        const tags = value.tags.split(', ');
        tags.unshift(config.site.category);

        const slug = slugify(title, { remove: /[$*_+~.()'"!\-:@]/g, lower: true });
        const body = `![${title}](${cover}) \n\n ### Description:\n\n ${description} \n\n ### Requirements:\n\n ${requirements} \n\n ### Price: ${price} ${currency}`;
        const categorySlug = slugify(category, { remove: /[$*_+~.()'"!\-:@]/g, lower: true });
        const jsonMetadata = {
          tags,
          category: categorySlug,
          price: `${price} ${currency}`,
          cover_image: cover,
          app: config.site.app_name,
        };
        const categoryData = await Category.findOne({ slug: categorySlug });
        const userData = await User.findOne({ username: req.session.user.name });

        const service = new Service();
        service.title = title;
        service.slug = slug;
        service.cover_image = cover;
        service.price = price;
        service.currency = currency;
        service.category = categoryData;
        service.seller = userData;

        steemconnect.setAccessToken(req.session.user.access_token);
        steemconnect.comment(
          '',
          config.site.category,
          req.session.user.name,
          slug,
          title,
          body,
          jsonMetadata,
          async (err) => {
            if (!err) {
              await service.save(() => {
                userData.services.push(service);
                userData.save();
                req.flash('success', 'Your service has been listed and also posted to STEEM Blackchain.', false);
                res.redirect('/dashboard');
              });
            } else {
              console.log(err);
            }
          },
        );
      } else {
        req.flash('error', err);
      }
    });
  },

  getSettings: async (req, res) => {
    const user = await User.findOne({ username: req.session.user.name });
    res.render('dashboard/settings', { title: 'Settings', user });
  },

  postSettings: (req, res, next) => {
    Joi.validate(req.body, JoiSchema.UserSettings, (err, value) => {
      if (!err) {
        User.findOne({ username: req.session.user.name }).exec((err, user) => {
          if (!err) {
            user.name = value.name;
            user.email = value.email;
            user.save((err) => {
              if (!err) {
                req.flash('success', 'Your settings have been saved!', false);
                res.redirect('/dashboard/settings');
              } else {
                console.log(err);
                next(err);
              }
            });
          } else {
            console.log(err);
            next(err);
          }
        });
      } else {
        console.log(err);
        next(err);
      }
    });
  },

  postManageService: async (req, res) => {
    switch (req.body.action) {
      case 'delete':
        await Service.deleteOne({ seller: req.session.user._id, _id: req.body.id }, (err) => {
          if (!err) {
            req.flash('success', 'Service has been deleted.', '/dashboard');
          } else {
            req.flash('error', 'Service can not be deleted.', '/dashboard');
          }
        });
        break;

      case 'pause':
        await Service.findOne({ seller: req.session.user._id, _id: req.body.id })
          .exec((err, service) => {
            console.log(service);
            if (!err) {
              service.paused = true;
              service.save();

              req.flash('success', 'Service has been paused.', '/dashboard');
            } else {
              req.flash('error', 'Service can not be paused.', '/dashboard');
            }
          });
        break;

      case 'resume':
        await Service.findOne({ seller: req.session.user._id, _id: req.body.id })
          .exec((err, service) => {
            if (!err) {
              service.paused = false;
              service.save();

              req.flash('success', 'Service has been successfully resumed.', '/dashboard');
            } else {
              req.flash('error', 'Service can not be resumed.', '/dashboard');
            }
          });
        break;

      default:
        res.redirect('/dashboard');
        break;
    }
  },

  getManageOrders: (req, res) => {
    const perPage = 20;
    const page = req.params.page || 1;
    const query = {};
    if (req.params.type === 'received') {
      query.seller = req.session.user._id;
    } else {
      query.buyer = req.session.user._id;
    }

    if (req.params.status === 'approved') {
      query.seller_approved = true;
    } else if (req.params.status === 'new') {
      query.seller_approved = false;
    } else if (req.params.status === 'disputed') {
      query.disputed = true;
    } else if (req.params.status === 'completed') {
      query.completed = true;
    }

    Order.find(query).skip((perPage * page) - perPage).limit(perPage).sort({ createdAt: -1 })
      .populate('buyer', 'username')
      .populate('seller', 'username')
      .populate('service', 'title price currency slug')
      .exec((err, orders) => {
        Order.find(query).count().exec((err, count) => {
          if (err) {
            console.log(err);
          }
          res.render('dashboard/orders', {
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

  postManageOrder: async (req, res) => {
    const { orderId, action } = req.body;

    const order = await Order.findById({ _id: orderId }).populate('seller', 'username').populate('buyer', 'username');

    switch (action) {
      case 'accept': {
        const returnURL = `${getSiteUrl(req)}/order/order-status/?action=escrow_approve&escrowId=${order.escrow_id}`;

        const hotSignLink = steemconnect.sign('escrow_approve', {
          from: order.buyer.username,
          to: order.seller.username,
          agent: config.site.agent_account,
          who: req.session.user.name,
          escrow_id: order.escrow_id,
          approve: 1,
        }, returnURL);

        res.redirect(hotSignLink);
      }
        break;

      case 'decline': {
        const returnURL = `${getSiteUrl(req)}/order/order-status/?action=escrow_approve&escrowId=${order.escrow_id}`;

        const hotSignLink = steemconnect.sign('escrow_approve', {
          from: order.buyer.username,
          to: order.seller.username,
          agent: config.site.agent_account,
          who: req.session.user.name,
          escrow_id: order.escrow_id,
          approve: 0,
        }, returnURL);

        res.redirect(hotSignLink);
      }
        break;

      case 'dispute': {
        const returnURL = `${getSiteUrl(req)}/order/order-status/?action=escrow_dispute&escrowId=${order.escrow_id}`;

        const hotSignLink = steemconnect.sign('escrow_dispute', {
          from: order.buyer.username,
          to: order.seller.username,
          agent: config.site.agent_account,
          who: req.session.user.name,
          escrow_id: order.escrow_id,
        }, returnURL);

        res.redirect(hotSignLink);
      }
        break;

      case 'deliver':
        Order.findOne({ _id: orderId, seller: req.session.user._id }).exec((err, order) => {
          if (!err) {
            order.delivered = true;
            order.save();

            req.flash('success', 'You deliveded the order. Please wait for seller to review your submission.', false);
            res.redirect('/dashboard');
          } else {
            req.flash('error', 'Operation was not successful. There was an error.', false);
            res.redirect('/dashboard');
          }
        });
        break;

      case 'request_modification':
        Order.findOne({ _id: orderId, buyer: req.session.user._id }).exec((err, order) => {
          if (!err) {
            order.delivered = false;
            order.modification_requested = true;
            order.save();

            req.flash('success', 'You have requested modification. Please wait for seller to respond.', false);
            res.redirect('/dashboard');
          } else {
            req.flash('error', 'Operation was not successful. There was an error.', false);
            res.redirect('/dashboard');
          }
        });
        break;

      case 'release':
        Order.findOne({
          $or: [
            { $or: [{ _id: orderId, seller: req.session.user._id }] },
            { $or: [{ _id: orderId, buyer: req.session.user._id }] },
          ],
        }).populate('seller', 'username').populate('buyer', 'username').populate('service', 'price currency')
          .exec((err, order) => {
            let receiver;
            let sbdAmount = '0.000 SBD';
            let steemAmount = '0.000 STEEM';

            if (req.session.user.name === order.seller.username) {
              receiver = order.buyer.username;
            } else {
              receiver = order.seller.username;
            }

            if (order.service.currency === 'SBD') {
              sbdAmount = `${parseFloat(order.service.price).toFixed(3)} ${order.service.currency}`;
            } else {
              steemAmount = `${parseFloat(order.service.price).toFixed(3)} ${order.service.currency}`;
            }

            const returnURL = `${getSiteUrl(req)}/order/order-status/?action=escrow_release&escrowId=${order.escrow_id}`;

            const hotSignLink = steemconnect.sign('escrow_release', {
              from: order.buyer.username,
              to: order.seller.username,
              agent: config.site.agent_account,
              who: req.session.user.name,
              receiver,
              escrow_id: order.escrow_id,
              sbd_amount: sbdAmount,
              steem_amount: steemAmount,
            }, returnURL);

            res.redirect(hotSignLink);
          });
        break;

      default:

        break;
    }
  },
};
