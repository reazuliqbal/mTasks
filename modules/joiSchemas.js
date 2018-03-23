const Joi = require('joi');

module.exports = {
    Category: Joi.object().keys({
        _csrf: Joi.string(),
        name: Joi.string().min(3).max(80).required(),
        image: Joi.string().empty('').default('/images/category-image.jpg'),
        description: Joi.string().empty('').max(500)
    }),

    UserSettings: Joi.object().keys({
        _csrf: Joi.string(),
        name: Joi.string().min(3).max(80).empty(''),
        username: Joi.string().required(),
        email: Joi.string().email({ minDomainAtoms: 2 }).empty('')
    })
}