const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const CategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    image: {
        type: String,
        default: '/images/category-image.jpg'
    },
    description: String
});

const Category = mongoose.model('category', CategorySchema);
module.exports = Category;