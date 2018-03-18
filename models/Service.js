const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ServiceSchema = new Schema({
    title: String,
    slug: {
        type: String,
        required: true,
        index: true
    },
    price: String,
    category: {
        type: Schema.Types.ObjectId,
        ref:'category'
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref:'user'
    },
    orders: {
        type: Number,
        default: 0
    },
    approved: Boolean
}, {timestamps: true});

const Service = mongoose.model('service', ServiceSchema);
module.exports = Service;