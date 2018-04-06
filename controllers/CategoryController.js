const Category = require('../models/Category');
const Service = require('../models/Service');

module.exports = {
  getIndex: (req, res) => {
    res.redirect('/');
  },
  getCategory: (req, res) => {
    Category.findOne({ slug: req.params.slug }, (err, category) => {
      if (err) {
        console.log(err);
      } else {
        Service.find({ category: category._id }).populate('seller', 'username').exec((err, services) => {
          if (err) {
            console.log(err);
          } else {
            res.render('category', { title: category.name, category, services });
          }
        });
      }
    });
  },
};
