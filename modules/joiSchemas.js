const Joi = require('joi');

module.exports = {
  AddCategory: Joi.object().keys({
    _csrf: Joi.string(),
    name: Joi.string().min(3).max(80).required(),
    image: Joi.string().empty('').default('/images/category-image.jpg'),
    description: Joi.string().empty('').max(500),
  }),
  EditCategory: Joi.object().keys({
    _csrf: Joi.string(),
    id: Joi.string(),
    name: Joi.string().min(3).max(80).required(),
    image: Joi.string().empty('').default('/images/category-image.jpg'),
    description: Joi.string().empty('').max(500),
  }),
  UserSettings: Joi.object().keys({
    _csrf: Joi.string(),
    name: Joi.string().min(3).max(80).empty(''),
    username: Joi.string().required(),
    email: Joi.string().email({ minDomainAtoms: 2 }).empty(''),
  }),
  AddService: Joi.object().keys({
    _csrf: Joi.string(),
    title: Joi.string().min(20).required().error(new Error('Title can not be empty.')),
    category: Joi.string().required().error(new Error('Please select a category that matches your service.')),
    cover: Joi.string().uri().error(new Error('Please provide a URL to an image.')),
    description: Joi.string().error(new Error('Write a short description about your offering.')),
    requirements: Joi.string().error(new Error('List your requirement to complete the task.')),
    tags: Joi.string().regex(/^[A-Za-z -]+(?:,[A-Za-z -]+)*$/).error(new Error('Tags should be comma separated string.')),
    price: Joi.number().positive().precision(3).error(new Error('Please enter your desired amount.')),
    currency: Joi.string().valid('STEEM', 'SBD').error(new Error('Currency should be STEEM or SBD')),
  }),
};
