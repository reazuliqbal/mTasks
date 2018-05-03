const express = require('express');
const helmet = require('helmet');
const DashboardController = require('../controllers/DashboardController');
const util = require('../modules/utils');

const router = express.Router();

router.get('/', [helmet.noCache(), util.isAuthenticated], DashboardController.getDashboard);

router.route('/add')
  .get(util.isAuthenticated, DashboardController.getAddService)
  .post(util.isAuthenticated, DashboardController.postAddService);

router.route('/settings')
  .get(util.isAuthenticated, DashboardController.getSettings)
  .post(util.isAuthenticated, DashboardController.postSettings);

router.route('/manage-service')
  .post(util.isAuthenticated, DashboardController.postManageService);

router.route('/manage-orders/:type/:status([a-z]{3,12})?/:page([0-9])?')
  .get([helmet.noCache(), util.isAuthenticated], DashboardController.getManageOrders);

router.route('/manage-order')
  .post(util.isAuthenticated, DashboardController.postManageOrder);

module.exports = router;
