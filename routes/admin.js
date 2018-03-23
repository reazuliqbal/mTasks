const express = require('express');
const bodyParser = require('body-parser');
const AdminController = require('../controllers/AdminController');
const util = require('../modules/utils');

const router = express.Router();

router.get('/', util.isAdmin, AdminController.getIndex);

router.route('/add-category')
.get( util.isAdmin, AdminController.getAddCategory)
.post( util.isAdmin, AdminController.postAddCategory);


router.get('/logout', util.isAdmin, AdminController.getLogout);

module.exports = router;