const slugify = require('slugify');
const Joi = require('joi');
const config = require('../config');
const steem = require('../modules/steem');
const steemconnect = require('../modules/steemconnect');
const User = require('../models/User');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Order = require('../models/Order');
const JoiSchema = require('../modules/joiSchemas');

module.exports = {
  getDashboard: async (req, res) => {
    const services = await Service.find({ seller: req.session.user._id }).populate('category').populate('seller', 'username');
    const placedOrders = await Order.find({ buyer: req.session.user._id, completed: false, escrow_active: true }).populate('seller', 'username').populate('service', 'title price currency slug');
    const ordersCompleted = await Order.find({
      seller: req.session.user._id, completed: true,
    }).count();
    const totalEarned = await Order.totalEarned(req.session.user._id);
    const pendingEarnings = await Order.pendingEarnings(req.session.user._id);

    const receivedOrders = await Order.find({ seller: req.session.user._id, completed: false, escrow_active: true }).populate('buyer', 'username').populate('service', 'title price currency slug');

    receivedOrders.forEach((order) => {
      steem.api.getEscrow(order.buyer.username, order.escrow_id, (err, result) => {
        if (result != null) {
          Order.findById(order._id, () => {
            order.seller_approved = result.to_approved;
            order.agent_approved = result.agent_approved;
            order.disputed = result.disputed;
            order.ratification_deadline = result.ratification_deadline;
            order.escrow_expiration = result.escrow_expiration;
            order.save();
          });
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
    const { orderId, action, wif } = req.body;

    const order = await Order.findById({ _id: orderId }).populate('seller', 'username').populate('buyer', 'username');

    switch (action) {
      case 'accept':
        steem.broadcast.escrowApprove(
          wif, order.buyer.username, order.seller.username, config.site.agent_account,
          req.session.user.name, order.escrow_id, true, async (err, result) => {
            if (!err && result.ref_block_num) {
              await Order.updateOne({ _id: orderId }, { $set: { seller_approved: true } });

              req.flash('success', 'You successfully accepted the order.', false);
              res.redirect('/dashboard');
            } else {
              console.log(err);
              req.flash('error', 'Operation is not completed. There was an error.', false);
              res.redirect('/dashboard');
            }
          },
        );
        break;

      case 'decline':
        steem.broadcast.escrowApprove(
          wif, order.buyer.username, order.seller.username, config.site.agent_account,
          req.session.user.name, order.escrow_id, false, async (err, result) => {
            if (!err && result.ref_block_num) {
              await Order.updateOne({ _id: orderId }, { $set: { seller_approved: false } });

              req.flash('info', 'You successfully declined the order.', false);
              res.redirect('/dashboard');
            } else {
              console.log(err);
              req.flash('error', 'Operation was not successful. There was an error.', false);
              res.redirect('/dashboard');
            }
          },
        );
        break;

      case 'dispute':
        steem.broadcast.escrowDispute(
          wif, order.buyer.username, order.seller.username, config.site.agent_account,
          req.session.user.name, order.escrow_id, false, async (err, result) => {
            if (!err && result.ref_block_num) {
              await Order.updateOne({ _id: orderId }, { $set: { disputed: true } });

              req.flash('info', 'You disputed the order. Please wait for agent to step in to mediate a solution.', false);
              res.redirect('/dashboard');
            } else {
              console.log(err);
              req.flash('error', 'Operation was not successful. There was an error.', false);
              res.redirect('/dashboard');
            }
          },
        );
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

            steem.broadcast.escrowRelease(
              wif, order.buyer.username, order.seller.username, config.site.agent_account,
              req.session.user.name, receiver, order.escrow_id, sbdAmount, steemAmount,
              async (err, result) => {
                if (!err && result.ref_block_num) {
                  order.completed = true;
                  order.save();

                  req.flash('success', `Order is marked as completed. Escrow fund is release to @${receiver}.`, false);
                  res.redirect('/dashboard');
                } else {
                  console.log(err);
                  req.flash('error', 'Operation was not successful. There was an error.', false);
                  res.redirect('/dashboard');
                }
              },
            );
          });
        break;

      default:

        break;
    }
  },
};
