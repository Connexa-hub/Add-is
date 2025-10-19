const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requirePin = require('../middleware/requirePin');
const cardController = require('../controllers/cardController');

router.get('/', verifyToken, cardController.getUserCards);
router.post('/', verifyToken, cardController.saveCard);
router.delete('/:cardId', verifyToken, requirePin, cardController.deleteCard);
router.post('/:cardId/default', verifyToken, cardController.setDefaultCard);
router.post('/:cardId/reveal', verifyToken, requirePin, cardController.revealCard);
router.get('/:cardId/token', verifyToken, requirePin, cardController.getCardToken);

module.exports = router;
