var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Service = require('../models/Service');
var IndexController = require('../controllers/IndexController');

router.get('/@:username?', IndexController.getProfile);

router.get('/@:username/:slug', IndexController.getContent);

module.exports = router;
