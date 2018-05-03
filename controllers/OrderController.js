const { forEach } = require('p-iteration');
const steem = require('../modules/steem');
const steemconnect = require('../modules/steemconnect');
const Order = require('../models/Order');
const Service = require('../models/Service');
const config = require('../config');

module.exports = {
  getOrder: async (req, res) => {
    res.redirect('/dashboard');
  },
  postOrder: async (req, res) => {
    const { serviceId } = req.body;

    Service.findById(serviceId).populate('seller', 'username').exec((err, service) => {
      if (service && service.approved && !service.paused) {
        const buyer = req.session.user.name;
        const escrowId = parseInt((Math.random() * (99999999 - 10000000)) + 10000000, 10);
        const fee = `${parseFloat(config.site.agent_fee).toFixed(3)} ${service.currency}`;
        const jsonMeta = { app: config.site.app_name };
        let sbdAmount = '0.000 SBD';
        let steemAmount = '0.000 STEEM';

        if (service.currency === 'SBD') {
          sbdAmount = `${parseFloat(service.price).toFixed(3)} SBD`;
        } else {
          steemAmount = `${parseFloat(service.price).toFixed(3)} STEEM`;
        }

        steem.api.getDynamicGlobalProperties(async (err, response) => {
          const time = new Date(`${response.time}Z`);
          const ratificationDeadline = new Date(time.getTime() + (86400 * 1000 * 3));
          const escrowExpiration = new Date(time.getTime() + (86400 * 1000 * 30));

          const order = new Order();
          order.service = serviceId;
          order.escrow_id = escrowId;
          order.seller = service.seller._id;
          order.buyer = req.session.user._id;
          order.escrow_expiration = escrowExpiration;
          order.ratification_deadline = ratificationDeadline;

          await order.save((err) => {
            if (!err) {
              const returnURL = `${config.order.redirect_uri}?escrowId=${escrowId}`;

              const hotSignLink = steemconnect.sign('escrow_transfer', {
                from: buyer,
                to: service.seller.username,
                agent: config.site.agent_account,
                escrow_id: escrowId,
                sbd_amount: sbdAmount,
                steem_amount: steemAmount,
                fee,
                ratification_deadline: ratificationDeadline.toISOString().slice(0, -5),
                escrow_expiration: escrowExpiration.toISOString().slice(0, -5),
                json_meta: JSON.stringify(jsonMeta),
              }, returnURL);

              res.redirect(hotSignLink);
            } else {
              console.log(err);
            }
          });
        });
      } else {
        req.flash('error', 'There was an error in processing the request. Please try again later.', false);
        res.redirect('/');
      }
    });
  },
  getOrderCompleted: (req, res) => {
    let { escrowId } = req.query;

    if (escrowId) {
      escrowId = parseInt(escrowId, 10);

      Order.findOne({ escrow_id: escrowId, buyer: req.session.user._id, completed: false })
        .populate('buyer', 'username')
        .populate('seller', 'username')
        .exec((err, order) => {
          if (err) {
            res.redirect('/dashboard');
          } else {
            steem.api.getEscrow(order.buyer.username, escrowId, async (err, result) => {
              if (!err && result !== null) {
                steem.api.getAccountHistory(order.buyer.username, -1, 50, (err, result) => {
                  if (!err && result.length > 0) {
                    result.reverse();
                    result.forEach(async (history) => {
                      if (history[1].op[0] === 'escrow_transfer') {
                        const escrowData = history[1].op[1];

                        if (escrowData.escrow_id === escrowId
                          && escrowData.from === order.buyer.username
                          && escrowData.to === order.seller.username) {
                          await Service.updateOne({ escrow_id: escrowId }, { $inc: { orders: 1 } });
                        }
                      }
                    });
                    res.render('thankyou', { title: 'Thank you.' });
                  } else {
                    req.flash('error', 'We could not find any transaction in your account history.', false);
                    res.redirect('/dashboard');
                  }
                });
              }
            });
          }
        });
    } else {
      res.redirect('/dashboard');
    }
  },

  getOrderStatus: async (req, res) => {
    let { escrowId } = req.query;
    const { action } = req.query;

    escrowId = parseInt(escrowId, 10);

    const order = await Order.findOne({
      $or: [
        { $or: [{ escrow_id: escrowId, seller: req.session.user._id }] },
        { $or: [{ escrow_id: escrowId, buyer: req.session.user._id }] },
      ],
    })
      .populate('buyer', 'username')
      .populate('seller', 'username');

    steem.api.getAccountHistory(req.session.user.name, -1, 10, (err, result) => {
      if (!err && result.length > 0) {
        result.reverse();

        switch (action) {
          case 'escrow_approve':
            forEach(result, (history) => {
              if (history[1].op[0] === 'escrow_approve') {
                const escrowData = history[1].op[1];

                if (escrowData.escrow_id === escrowId && escrowData.who === req.session.user.name) {
                  order.escrow_active = escrowData.approve;
                  order.seller_approved = escrowData.approve;
                  order.save();
                }
              }
            });

            res.redirect('/dashboard');

            break;

          case 'escrow_dispute':
            forEach(result, (history) => {
              if (history[1].op[0] === 'escrow_dispute') {
                const escrowData = history[1].op[1];

                if (escrowData.escrow_id === escrowId && escrowData.who === req.session.user.name) {
                  order.disputed = true;
                  order.save();
                }
              }
            });

            res.redirect('/dashboard');

            break;

          case 'escrow_release':
            forEach(result, (history) => {
              if (history[1].op[0] === 'escrow_release') {
                const escrowData = history[1].op[1];
                console.log(escrowData);
                if (escrowData.escrow_id === escrowId && escrowData.who === req.session.user.name) {
                  order.completed = true;
                  order.save();
                }
              }
            });

            res.redirect('/dashboard');

            break;

          default:

            break;
        }
      } else {
        console.log(err);
      }
    });
  },
};
