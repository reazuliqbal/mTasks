const mongoose = require('mongoose');

const { Schema } = mongoose;
const ServiceSchema = new Schema({
  title: String,
  slug: {
    type: String,
    required: true,
    index: true,
  },
  price: Number,
  currency: {
    type: String,
    enum: ['SBD', 'STEEM'],
  },
  cover_image: {
    type: String,
    default: '/images/service-image.jpg',
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'category',
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  orders: {
    type: Number,
    default: 0,
  },
  approved: {
    type: Boolean,
    default: true,
  },
  paused: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Service = mongoose.model('service', ServiceSchema);
module.exports = Service;
