const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const OrderSchema = Schema({
    service: { type: Schema.Types.ObjectId, ref:'service' },
    seller: { type: Schema.Types.ObjectId, ref:'user' },
    buyer: { type: Schema.Types.ObjectId, ref:'user' },
    escrow_id: Number,
    block_num: Number,
    seller_approved: {
        type: Boolean,
        default: false
    },
    agent_approved: {
        type: Boolean,
        default: false
    },
    disputed: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    ratification_deadline: Date,
    escrow_expiration: Date
}, {timestamps: true});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;