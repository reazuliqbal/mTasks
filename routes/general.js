const express = require('express');
const IndexController = require('../controllers/IndexController');
const util = require('../modules/utils');

const router = express.Router();

router.get('/', IndexController.getIndex);

router.get('/connect', IndexController.getConnect);
router.get('/logout', IndexController.getLogout);

router.route('/register')
  .get(util.isAuthenticated, IndexController.getRegister)
  .post(util.isAuthenticated, IndexController.postRegister);

module.exports = router;
