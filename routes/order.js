const express = require('express');
const OrderController = require('../controllers/OrderController');
const util = require('../modules/utils');

const router = express.Router();

router.route('/')
  .get(util.isAuthenticated, OrderController.getOrder)
  .post(util.isAuthenticated, OrderController.postOrder);

module.exports = router;
