const express = require('express');
const bodyParser = require('body-parser');
const DashboardController = require('../controllers/DashboardController');
const util = require('../modules/utils');

const router = express.Router();

router.get('/', util.isAuthenticated, DashboardController.getDashboard);

router.route('/add')
    .get( util.isAuthenticated, DashboardController.getServiceAdd)
    .post( util.isAuthenticated, DashboardController.postServiceAdd);

router.route('/settings')
    .get( util.isAuthenticated, DashboardController.getSettings)
    .post( util.isAuthenticated, DashboardController.postSettings);

module.exports = router;
