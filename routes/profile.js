const express = require('express');
const IndexController = require('../controllers/IndexController');

const router = express.Router();

router.get('/@:username?', IndexController.getProfile);

router.get('/@:username/:slug', IndexController.getContent);

module.exports = router;
