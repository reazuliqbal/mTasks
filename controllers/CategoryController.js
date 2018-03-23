const Category = require('../models/Category');
const Service = require('../models/Service');
module.exports = {
    getIndex: (req, res, next) => {
        res.redirect('/');
    },

    getCategory: (req, res, next) => {
        Category.findOne({ slug: req.params.slug }, (err, category) => {
            if(err) {
                console.log(err);
            } else if (category) {
                Service.find({ category: category._id }).populate('seller', 'username')
                .exec((err, services) => {
                    if(err) {
                        console.log(err);
                    } else if (services) {
                        res.render('category', { title: category.name, category: category, services: services });
                    }
                });
            } else {
                console.log('error happended');
            }
        });
    }
}