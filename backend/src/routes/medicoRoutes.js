const express = require('express');
const router = express.Router();
const { getMedicos, getAgenda } = require('../controllers/medicoController');

router.get('/', getMedicos);
router.get('/:id/citas', getAgenda);

module.exports = router;
