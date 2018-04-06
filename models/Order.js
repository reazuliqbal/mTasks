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
