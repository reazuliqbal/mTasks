const express = require('express');
const helmet = require('helmet');
const AdminController = require('../controllers/AdminController');
const util = require('../modules/utils');

const router = express.Router();

router.get('/', [helmet.noCache(), util.isAdmin], AdminController.getIndex);

router.route('/categories/:id?')
  .get(util.isAdmin, AdminController.getManageCategory)
  .post(util.isAdmin, AdminController.postManageCategory);

router.route('/manage-orders/:type([a-z]{3,12})?/:page([0-9])?')
  .get([helmet.noCache(), util.isAdmin], AdminController.getManageOrders)
  .post(util.isAdmin, AdminController.postManageOrders);

router.get('/users/:page?', util.isAdmin, AdminController.getUsers);
router.get('/logout', util.isAdmin, AdminController.getLogout);

module.exports = router;
