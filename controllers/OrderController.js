const steem = require('steem');
const steemconnect = require('../modules/steemconnect')
const Order = require('../models/Order');
const Service = require('../models/Service');
const User = require('../models/User');
const config = require('../config')

module.exports = {
    getOrder: async (req, res, next) => {
        res.redirect('/dashboard');
    },

    postOrder: async (req, res, next) => {
        steem.api.setOptions({ url: 'wss://testnet.steem.vc' });
        steem.config.set('address_prefix', 'STX');
        steem.config.set('chain_id', '79276aea5d4877d9a25892eaa01b0adf019d3e5cb12a97478df3298ccdd01673');

        var wif = req.body.wif,
            buyer = req.session.user.name,
            seller = req.body.seller,
            price = req.body.price,
            service = req.body.service,
            escrow_id = parseInt(Math.random() * (99999999 - 10000000) + 10000000),
            sbd_amount = '0.000 SBD',
            steem_amount= '0.000 STEEM',
            currency = price.split(' '),
            fee = `${parseFloat(config.site.agent_fee).toFixed(3)} ${currency[1]}`,
            json_meta= '';

        if( currency[1] === 'SBD' ) {
            sbd_amount = `${parseFloat(price).toFixed(3)} SBD`;
        } else {
            steem_amount = `${parseFloat(price).toFixed(3)} STEEM`;
        }
        
        
        steem.api.getDynamicGlobalProperties(function(err, response) {
            const time = new Date(response.time + 'Z');
            let ratification_deadline = new Date(time.getTime() + 86400 * 1000 * 3);
            let escrow_expiration = new Date(time.getTime() + 86400 * 1000 * 30);

            steem.broadcast.escrowTransfer(
                wif,
                buyer,
                seller,
                config.site.agent_account,
                escrow_id,
                sbd_amount,
                steem_amount,
                fee,
                ratification_deadline,
                escrow_expiration,
                json_meta,
                async (err, response) => {
                    if(!err && response.ref_block_num) {
                        var seller_data = await User.findOne({ username: seller });

                        var order = new Order();
                            order.service = service;
                            order.escrow_id = escrow_id;
                            order.seller = seller_data._id;
                            order.buyer = req.session.user._id;
                            order.block_num = response.block_num;

                        await order.save( async (err) => {
                            await Service.updateOne({ _id: req.body.service }, {$inc: {orders: 1}});
                            res.render('thankyou', { title: 'Thank you', order: order });
                        });
                    } else {
                        console.error(err);
                    }
                }
            );
        });
    },

    getOrderComplete: (req, res, next) => {

    }
}