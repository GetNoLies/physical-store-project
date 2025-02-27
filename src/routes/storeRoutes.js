const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.post('/stores', storeController.createStore);
router.get('/stores/:cep', storeController.findStoresByCep);

module.exports = router;