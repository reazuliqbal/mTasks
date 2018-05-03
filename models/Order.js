const mongoose = require('mongoose');

const { Schema } = mongoose;
const OrderSchema = new Schema({
  service: { type: Schema.Types.ObjectId, ref: 'service' },
  seller: { type: Schema.Types.ObjectId, ref: 'user' },
  buyer: { type: Schema.Types.ObjectId, ref: 'user' },
  escrow_id: Number,
  block_num: Number,
  seller_approved: {
    type: Boolean,
    default: false,
  },
  agent_approved: {
    type: Boolean,
    default: false,
  },
  disputed: {
    type: Boolean,
    default: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  escrow_active: {
    type: Boolean,
    default: true,
  },
  delivered: {
    type: Boolean,
    default: false,
  },
  modification_requested: {
    type: Boolean,
    default: false,
  },
  ratification_deadline: Date,
  escrow_expiration: Date,
}, { timestamps: true });

OrderSchema.statics = {
  ordersCompleted(seller) {
    return this.find({ seller, completed: true }).count();
  },

  getOrders(user, type) {
    let query = { seller: user };
    if (type === 'placed') {
      query = { buyer: user };
    }
    return this.find(query)
      .where('completed', false)
      .where('escrow_active', true)
      .sort({ createdAt: -1 })
      .populate('seller', 'username')
      .populate('buyer', 'username')
      .populate('service', 'title price currency slug');
  },

  updateOrder(orderId, data) {
    return this.updateOne(
      { _id: orderId },
      {
        $set: {
          escrow_active: data.escrow_active,
          seller_approved: data.to_approved,
          agent_approved: data.agent_approved,
          disputed: data.disputed,
          ratification_deadline: data.ratification_deadline,
          escrow_expiration: data.escrow_expiration,
        },
      },
    ).exec();
  },

  totalEarned(seller) {
    return this.aggregate([
      { $match: { seller, completed: true } },
      {
        $lookup: {
          from: 'services', localField: 'service', foreignField: '_id', as: 'service',
        },
      },
      { $unwind: '$service' },
      { $group: { _id: '$service.currency', total: { $sum: '$service.price' } } },
    ]);
  },

  pendingEarnings(seller) {
    return this.aggregate([
      {
        $match: {
          seller, completed: false, agent_approved: true, seller_approved: true,
        },
      },
      {
        $lookup: {
          from: 'services', localField: 'service', foreignField: '_id', as: 'service',
        },
      },
      { $unwind: '$service' },
      { $group: { _id: '$service.currency', total: { $sum: '$service.price' } } },
    ]);
  },
};

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
