const express = require('express');
const CategoryController = require('../controllers/CategoryController');

const router = express.Router();

router.get('/', CategoryController.getIndex);

router.get('/:slug', CategoryController.getCategory);

module.exports = router;
