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
              const returnURL = `${config.order.redirect_uri}?escrowId=${escrowId}&buyer=${buyer}`;

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
    const { escrowId } = req.query;

    if (escrowId) {
      steem.api.getEscrow(req.session.user.name, parseInt(escrowId, 10), async (err, result) => {
        if (!err && result !== null) {
          await Service.updateOne({ _id: req.body.service }, { $inc: { orders: 1 } });
          res.render('thankyou', { title: 'Thank you.' });
        } else {
          req.flash('error', 'We could not find any transaction associated with these details.', false);
          res.redirect('/dashboard');
        }
      });
    } else {
      res.redirect('/dashboard');
    }
  },
};
