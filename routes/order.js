const express = require('express');
const bodyParser = require('body-parser');
const OrderController = require('../controllers/OrderController');
const util = require('../modules/utils');

var router = express.Router();

router.route('/')
    .get( util.isAuthenticated, OrderController.getOrder )
    .post( util.isAuthenticated, OrderController.postOrder );

module.exports = router;