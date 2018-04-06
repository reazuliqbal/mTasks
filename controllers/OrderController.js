const steem = require('../modules/steem');
// const steemconnect = require('../modules/steemconnect');
const Order = require('../models/Order');
const Service = require('../models/Service');
const User = require('../models/User');
const config = require('../config');

module.exports = {
  getOrder: async (req, res) => {
    res.redirect('/dashboard');
  },
  postOrder: async (req, res) => {
    const {
      wif,
      seller,
      price,
      service,
    } = req.body;
    const buyer = req.session.user.name;
    const escrowId = parseInt((Math.random() * (99999999 - 10000000)) + 10000000, 10);
    const currency = price.split(' ');
    const fee = `${parseFloat(config.site.agent_fee).toFixed(3)} ${currency[1]}`;
    const jsonMeta = '';
    let sbdAmount = '0.000 SBD';
    let steemAmount = '0.000 STEEM';

    if (currency[1] === 'SBD') {
      sbdAmount = `${parseFloat(price).toFixed(3)} SBD`;
    } else {
      steemAmount = `${parseFloat(price).toFixed(3)} STEEM`;
    }


    steem.api.getDynamicGlobalProperties((err, response) => {
      const time = new Date(`${response.time}Z`);
      const ratificationDeadline = new Date(time.getTime() + (86400 * 1000 * 3));
      const escrowExpiration = new Date(time.getTime() + (86400 * 1000 * 30));

      steem.broadcast.escrowTransfer(
        wif,
        buyer,
        seller,
        config.site.agent_account,
        escrowId,
        sbdAmount,
        steemAmount,
        fee,
        ratificationDeadline,
        escrowExpiration,
        jsonMeta,
        async (err, response) => {
          if (!err && response.ref_block_num) {
            const sellerData = await User.findOne({ username: seller });

            const order = new Order();
            order.service = service;
            order.escrow_id = escrowId;
            order.seller = sellerData._id;
            order.buyer = req.session.user._id;
            order.block_num = response.block_num;
            order.escrow_expiration = escrowExpiration;
            order.ratification_deadline = ratificationDeadline;

            await order.save(async (err) => {
              if (!err) {
                await Service.updateOne({ _id: req.body.service }, { $inc: { orders: 1 } });
                res.render('thankyou', { title: 'Thank you', order });
              } else {
                console.log(err);
              }
            });
          } else {
            console.error(err);
          }
        },
      );
    });
  },
  getOrderComplete: (req, res) => {
    res.send('Order Completed!');
  },
};
