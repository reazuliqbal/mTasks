const mongoose = require('mongoose');

const { Schema } = mongoose;
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    default: '/images/category-image.jpg',
  },
  description: String,
});

const Category = mongoose.model('category', CategorySchema);
module.exports = Category;
